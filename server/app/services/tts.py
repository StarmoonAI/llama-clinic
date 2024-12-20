import asyncio
import base64
import json
import os
import re
import traceback

import azure.cognitiveservices.speech as speechsdk
import emoji
from app.celery.tasks import emotion_detection
from app.core.config import settings
from app.services.clients import Clients

# from app.services.fish_speech import voice_clone
from azure.cognitiveservices.speech import SpeechConfig
from celery.result import AsyncResult
from dotenv import load_dotenv
from fastapi import WebSocket
from fish_audio_sdk import Session, TTSRequest, ReferenceAudio

load_dotenv()


SPEECH_KEY = settings.SPEECH_KEY
SPEECH_REGION = settings.SPEECH_REGION
speech_config = SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
speech_config.set_property(
    property_id=speechsdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary,
    value="true",
)


toyid2speechname = {
    "6c3eb71a-8d68-4fc6-85c5-27d283ecabc8": "en-US-KaiNeural",
    "14d91296-eb6b-41d7-964c-856a8614d80e": "en-US-AvaMultilingualNeural",
    "56224f7f-250d-4351-84ee-e4a13b881c7b": "en-US-AnaNeural",
}


def create_emotion_detection_task(
    utterance: str,
    user: dict,
    role: str,
    session_id: str,
    is_sensitive: bool = False,
):
    # send utterance to celery task
    celery_task = emotion_detection.delay(
        utterance, user, role, session_id, is_sensitive
    )
    task_id = celery_task.id

    return task_id


async def check_task_result_hardware(task_id: str, text_queue: asyncio.Queue):
    celery_task = AsyncResult(task_id)

    while not celery_task.ready():
        await asyncio.sleep(1)  # Wait for 1 second before checking again

    result = celery_task.result

    if isinstance(result, Exception):
        result = {
            "error": str(result),
            "traceback": traceback.format_exception_only(type(result), result),
        }

    text_queue.put_nowait(
        {
            "type": "json",
            "device": "web",
            "data": {
                "type": "task",
                "audio_data": None,
                "text_data": result,
                "boundary": None,
                "task_id": task_id,
            },
        }
    )


async def check_task_result(task_id: str, websocket: WebSocket):
    celery_task = AsyncResult(task_id)

    while not celery_task.ready():
        await asyncio.sleep(0.5)  # Wait for 1 second before checking again

    result = celery_task.result

    if isinstance(result, Exception):
        result = {
            "error": str(result),
            "traceback": traceback.format_exception_only(type(result), result),
        }

    await websocket.send_json(
        json.dumps(
            {
                "type": "task",
                "audio_data": None,
                "text_data": result,
                "boundary": None,
                "task_id": task_id,
            }
        )
    )


def azure_voice_systhesizer(
    text: str,
    language: str = "en-US",
    voice_name: str = "en-US-AvaMultilingualNeural",
    emotion: str = "",
    emotion_degree: float = 0,  # default
    emotion_role: str = None,
    rate: float = 0,
    pitch: float = 0,
):
    # https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice

    ssml = f"""<speak version='1.0' xml:lang="{language}" xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
    <voice name="{voice_name}">
        <mstts:express-as style="{emotion}" styledegree="{emotion_degree}">
            <prosody rate="{rate}%" pitch="{pitch}%">
                {text}
            </prosody>
        </mstts:express-as>
    </voice>
    </speak>"""

    return ssml


def azure_speech_response(ssml: str):
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None
    )

    result = speech_synthesizer.speak_ssml_async(ssml).get()
    # send response back to the client
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        # await websocket.send_bytes(result.audio_data)
        return result

    return None


async def azure_send_response_and_speech(
    sentence: str,
    boundary: str,
    websocket: WebSocket,
    task_id: str,
    toy_id: str,
    device: str,
):
    print("sentence+++", sentence)
    # combined_sentences = (
    #     f"{previous_sentence}\n\n{sentence}" if previous_sentence else sentence
    # )
    # emotion = get_emotion(combined_sentences.strip())
    voice_name = toyid2speechname[toy_id]
    text_tone = azure_voice_systhesizer(
        text=sentence.strip(),
        voice_name=voice_name,
        # emotion=emotion["tone"],
        emotion="",
        # emotion_degree=emotion["score"],
        emotion_degree="",
        rate=0,
    )
    # print finished time

    result = azure_speech_response(text_tone)

    # Send the JSON object over the WebSocket connection
    if device == "web":
        # Encode the audio data to base64
        audio_data_base64 = base64.b64encode(result.audio_data).decode("utf-8")

        # Create a JSON object with the encoded data
        json_data = json.dumps(
            {
                "type": "response",  # Specify the type of message
                "audio_data": audio_data_base64,
                "text_data": sentence,
                "boundary": boundary,  # Use the boundary parameter instead of sentence
                "task_id": task_id,
            }
        )
        await websocket.send_json(json_data)
    else:
        # Send an end-of-audio marker
        if boundary == "start":
            await websocket.send_text(json.dumps({"type": "start_of_audio"}))
        # Send audio data in chunks
        chunk_size = 1024  # Adjust this value based on your needs
        audio_data = result.audio_data
        for i in range(0, len(audio_data), chunk_size):
            chunk = audio_data[i : i + chunk_size]
            print("Audio chunk+++++++++", i)
            await websocket.send_bytes(chunk)

        # Send an end-of-audio marker
        if boundary == "end":
            await websocket.send_text(json.dumps({"type": "end_of_audio"}))


def azure_tts(
    sentence: str,
    boundary: str,
    task_id: str,
    toy_id: str,
    device: str,
    bytes_queue: asyncio.Queue,
):
    print("sentence+++", sentence)
    voice_name = toyid2speechname[toy_id]
    text_tone = azure_voice_systhesizer(
        text=sentence.strip(),
        voice_name=voice_name,
        # emotion=emotion["tone"],
        emotion="",
        # emotion_degree=emotion["score"],
        emotion_degree="",
        rate=0,
    )

    result = azure_speech_response(text_tone)
    print("result++++++++", result)

    # Send the JSON object over the WebSocket connection
    if device == "web":
        audio_data_base64 = base64.b64encode(result.audio_data).decode("utf-8")
        bytes_queue.put_nowait(
            {
                "type": "json",
                "device": device,
                "data": {
                    "type": "response",
                    "audio_data": audio_data_base64,
                    "text_data": sentence,
                    "boundary": boundary,
                    "task_id": task_id,
                },
            }
        )
    else:
        chunk_size = 1024  # Adjust this value based on your needs
        max_len = len(result.audio_data)
        if max_len > 100:
            audio_data = result.audio_data[100:]
        else:
            audio_data = result.audio_data
        for i in range(0, len(audio_data), chunk_size):
            chunk = audio_data[i : i + chunk_size]
            # print("Audio chunk+++++++++", i)
            bytes_queue.put_nowait(
                {"type": "bytes", "device": device, "data": chunk, "id": i}
            )


session = Session("af9be9fe8dfa49dc8a2bbb0c4f5b11c1")

toyid2speechname_fish = {
    "6c3eb71a-8d68-4fc6-85c5-27d283ecabc8": "90395af35dc44df6856f4fe287fdfb22",
    "14d91296-eb6b-41d7-964c-856a8614d80e": "f187db9986f545b986af014579c7fae4",
    "56224f7f-250d-4351-84ee-e4a13b881c7b": "f187db9986f545b986af014579c7fae4",
}


def fish_tts(
    sentence: str,
    boundary: str,
    task_id: str,
    toy_id: str,
    device: str,
    bytes_queue: asyncio.Queue,
):
    chunks = []
    for chunk in session.tts(
        TTSRequest(
            reference_id=toyid2speechname_fish[toy_id],
            text=sentence,
        )
    ):
        chunks.append(chunk)

    if device == "web":
        audio_data_base64 = base64.b64encode(b"".join(chunks)).decode("utf-8")
        bytes_queue.put_nowait(
            {
                "type": "json",
                "device": device,
                "data": {
                    "type": "response",
                    "audio_data": audio_data_base64,
                    "text_data": sentence,
                    "boundary": boundary,
                    "task_id": task_id,
                },
            }
        )

    else:
        chunk_size = 1024  # Adjust this value based on your needs
        max_len = len(chunks)
        if max_len > 100:
            audio_data = chunks[100:]
        else:
            audio_data = chunks
        for i in range(0, len(audio_data), chunk_size):
            chunk = audio_data[i : i + chunk_size]
            # print("Audio chunk+++++++++", i)
            bytes_queue.put_nowait(
                {"type": "bytes", "device": device, "data": chunk, "id": i}
            )
