import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAssistantAvatar, getUserAvatar } from "@/lib/utils";

interface ChatAvatarProps {
    role: string;
    user: IUser;
    character: ITestCharacter;
}

const ChatAvatar: React.FC<ChatAvatarProps> = ({ role, user, character }) => {
    const imageSrc: string =
        role === "input"
            ? getUserAvatar(user.avatar_url)
            : "/" + character.name + "_avatar.png";

    return (
        <Avatar className="h-8 w-8">
            <AvatarImage src={imageSrc} alt="@shadcn" />
            <AvatarFallback className="text-sm">
                {user.email.slice(0, 2)}
            </AvatarFallback>
        </Avatar>
    );
};

export default ChatAvatar;
