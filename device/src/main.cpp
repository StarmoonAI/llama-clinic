

#include <Arduino.h>
#include "WiFiSetup.h"
#include "I2SHandler.h"
#include <WebSocketsClient.h>
#include <driver/i2s.h>
#include <driver/rtc_io.h>

WebSocketsClient webSocket;
String authMessage;
int currentVolume = 50;
bool isPlayingAudio = true;

const uint32_t wifiConnectTimeoutMs = 10000;

#define DEEP_SLEEP_EXT0
// RTC_DATA_ATTR int sleep_count = 0;

void showWakeReason()
{
    auto cause = esp_sleep_get_wakeup_cause();
    switch (cause)
    {
    case ESP_SLEEP_WAKEUP_UNDEFINED:
        Serial.println("Undefined"); // most likely a boot up after a reset or power cycly
        break;
    case ESP_SLEEP_WAKEUP_EXT0:
        Serial.println("Wakeup reason: EXT0");
        break;
    case ESP_SLEEP_WAKEUP_ULP:
        Serial.println("Wakeup reason: ULP");
        break;
    default:
        Serial.printf("Wakeup reason: %d\n", cause);
    }
    // Serial.printf("Count %d\n", sleep_count);
    // sleep_count++;
}

void enterSleep()
{
    Serial.println("Going to sleep...");
    delay(1000);

#ifdef DEEP_SLEEP_EXT0
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    rtc_gpio_hold_en(BUTTON_PIN);
    esp_sleep_enable_ext0_wakeup(BUTTON_PIN, LOW);
#endif
    esp_deep_sleep_start();
}

String createAuthTokenMessage(String token)
{
    JsonDocument doc;
    doc["token"] = token;
    doc["device"] = "esp";
    doc["user_id"] = NULL;
    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}

void scaleAudioVolume(uint8_t *input, uint8_t *output, size_t length, int volume)
{
    // Convert volume from 0-100 range to 0.0-1.0 range
    float volumeScale = volume / 100.0f;

    // Process 16-bit samples (2 bytes per sample)
    for (size_t i = 0; i < length; i += 2)
    {
        // Convert two bytes to a 16-bit signed integer
        int16_t sample = (input[i + 1] << 8) | input[i];

        // Scale the sample
        float scaledSample = sample * volumeScale;

        // Clamp the value to prevent overflow
        if (scaledSample > 32767)
            scaledSample = 32767;
        if (scaledSample < -32768)
            scaledSample = -32768;

        // Convert back to bytes
        int16_t finalSample = (int16_t)scaledSample;
        output[i] = finalSample & 0xFF;
        output[i + 1] = (finalSample >> 8) & 0xFF;
    }
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
    switch (type)
    {
    case WStype_DISCONNECTED:
        Serial.printf("[WSc] Disconnected!\n");
        // digitalWrite(LED_PIN, LOW);
        vTaskDelay(1000);
        enterSleep();
        isPlayingAudio = false;
        break;
    case WStype_CONNECTED:
        Serial.printf("[WSc] Connected to url: %s\n", payload);
        // authMessage = createAuthTokenMessage(authTokenGlobal);
        authMessage = createAuthTokenMessage(auth_token);
        webSocket.sendTXT(authMessage);
        // digitalWrite(LED_PIN, HIGH);
        break;
    case WStype_TEXT:
        // Serial.printf("[WSc] get text: %s\n", payload);

        if (strcmp((char *)payload, "END") == 0)
        {
            delay(1000);
            webSocket.sendTXT("{\"speaker\": \"user\", \"is_replying\": false, \"is_interrupted\": false, \"is_ending\": false, \"is_end_of_sentence\": false}");
            isPlayingAudio = false;
        }
        else if (strcmp((char *)payload, "END_OF_SENTENCE") == 0)
        {
            webSocket.sendTXT("{\"speaker\": \"user\", \"is_replying\": true, \"is_interrupted\": false, \"is_ending\": false, \"is_end_of_sentence\": true}");
        }
        else
        {
            JsonDocument doc;
            DeserializationError error = deserializeJson(doc, (char *)payload);

            const char *type_content = doc["type"];
            if (strcmp(type_content, "auth_success") == 0)
            {
                Serial.println(type_content);
                currentVolume = doc["data"].as<int>();
            }
            if (strcmp(type_content, "warning") == 0)
            {
                if (doc["data"] == "OFF")
                {
                    Serial.println("Timeout received. Going to sleep...");
                    webSocket.disconnect();
                    delay(800);
                    enterSleep();
                }
            }
        }
        break;
    case WStype_BIN:
    {
        // Write the audio data directly to I2S at max volume
        size_t bytes_written;
        i2s_write(I2S_PORT_OUT, payload, length, &bytes_written, portMAX_DELAY);
        isPlayingAudio = true;
    }
    break;
    case WStype_ERROR:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_PONG:
    case WStype_PING:
    case WStype_FRAGMENT_FIN:
        break;
    }
}

void websocketSetup(String server_domain, int port, String path)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("Not connected to WiFi. Abandoning setup websocket");
        return;
    }
    Serial.println("connected to WiFi");
    webSocket.begin(server_domain, port, path);
    webSocket.onEvent(webSocketEvent);
    // webSocket.setAuthorization("user", "Password");
    webSocket.setReconnectInterval(1000);
}

void connectToWifiAndWS()
{
    // Attempt to connect to Wi-Fi and start WebSocket if needed
    if (!connectToWiFi())
    {
        Serial.println("Failed to connect to Wi-Fi. Good night!");
        enterSleep();
        return;
    }

    // Connect to WebSocket if successfully registered
    Serial.println("Connecting to WebSocket server...");
    websocketSetup(backend_server, backend_port, websocket_path);
}

void buttonTask(void *parameter)
{
    const int LONG_PRESS_TIME = 2000; // 2 seconds for long press
    unsigned long pressStartTime = 0;
    bool isPressing = false;

    while (1)
    {
        if (digitalRead(BUTTON_PIN) == LOW)
        { // Button is pressed
            if (!isPressing)
            { // Button was just pressed
                isPressing = true;
                pressStartTime = millis();
            }
            else
            { // Button is being held
                // Check for long press
                if (millis() - pressStartTime >= LONG_PRESS_TIME)
                {
                    Serial.println("Long press - entering sleep mode");
                    webSocket.sendTXT("{\"speaker\": \"user\", \"is_replying\": false, \"is_interrupted\": false, \"is_ending\": true, \"is_end_of_sentence\": false}");
                    // webSocket.disconnect();
                    delay(1000);
                    enterSleep();
                }
            }
        }
        else
        { // Button is released
            if (isPressing)
            { // Button was just released
                if (millis() - pressStartTime < LONG_PRESS_TIME)
                {
                    // Short press - send WebSocket message
                    Serial.println("Short press - sending message");
                    isPlayingAudio = false;
                    webSocket.sendTXT("{\"speaker\": \"user\", \"is_replying\": false, \"is_interrupted\": true, \"is_ending\": false, \"is_end_of_sentence\": false}");
                }
                isPressing = false;
            }
        }

        vTaskDelay(100);
    }
}

void micTask(void *parameter)
{
    i2s_install_mic();
    i2s_setpin_mic();
    i2s_start(I2S_PORT_IN);

    int i2s_read_len = I2S_READ_LEN;
    size_t bytes_read;

    char *i2s_read_buff = (char *)calloc(i2s_read_len, sizeof(char));
    uint8_t *flash_write_buff = (uint8_t *)calloc(i2s_read_len, sizeof(char));

    while (1)
    {
        esp_err_t result = i2s_read(I2S_PORT_IN, (void *)i2s_read_buff, i2s_read_len, &bytes_read, portMAX_DELAY);

        if (result == ESP_OK && webSocket.isConnected())
        {
            // Apply scaling to the read data
            i2s_adc_data_scale(flash_write_buff, (uint8_t *)i2s_read_buff, i2s_read_len);
            webSocket.sendBIN(flash_write_buff, (size_t)i2s_read_len);
        }
        vTaskDelay(10);
    }

    free(i2s_read_buff);
    i2s_read_buff = NULL;
    free(flash_write_buff);
    flash_write_buff = NULL;
    // vTaskDelete(NULL);
}

void setup()
{
    Serial.begin(115200);
    delay(500);

    // resetDevice();

    showWakeReason();

    // Set SD_PIN as output and initialize to HIGH (unmuted)
    pinMode(I2S_SD_OUT, OUTPUT);
    digitalWrite(I2S_SD_OUT, HIGH);

    pinMode(BUTTON_PIN, INPUT_PULLUP);
    // pinMode(LED_PIN, OUTPUT);
    // digitalWrite(LED_PIN, LOW);

    xTaskCreate(buttonTask, "Button Task", 8192, NULL, 5, NULL);

    connectToWifiAndWS();
    i2s_install_speaker();
    i2s_setpin_speaker();

    xTaskCreate(micTask, "Microphone Task", 4096, NULL, 4, NULL);
}

void loop()
{
    webSocket.loop();
    Serial.println("Is playing audio");
    Serial.println(isPlayingAudio);
}
