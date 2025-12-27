import ChatHeader from "./ChatHeader";
import UserMessage from "./UserMessage";
import AgentMessage from "./AgentMessage";
import ChatInput from "./ChatInput";
import UserAvatar from "./UserAvatar";

const ChatArea = () => {
  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Header */}
      <ChatHeader projectName="test" />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
        <div className="max-w-[900px] mx-auto space-y-6">
          {/* User Message */}
          <UserMessage content="Analyze molecular structures of specific small molecule candidates" />

          {/* Agent Response */}
          <AgentMessage>
            <p>
              I'll help you analyze molecular structures of small molecule candidates. To provide the most relevant analysis, I need to understand what specific molecules you'd like to analyze and what type of analysis you're looking for.
            </p>
            <p>
              Let me first check what data is available in your context directory:No files found matching pattern '*' in /opt/nfs-share/c150d73d-fa33-4f41-9523-1e42eba881dcIt looks like there are no files in the current context directory. For molecular structure analysis, I can help you in several ways:
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6">
              Available Analysis Options:
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  1. Molecule Database Search & Analysis
                </h4>
                <p className="text-muted-foreground mt-1">
                  I can search a comprehensive molecular database using various criteria:
                </p>
                <ul className="mt-2 space-y-1.5 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 mt-2 flex-shrink-0" />
                    <span>
                      <strong>Property-based search</strong>: Filter by molecular weight, logP, hydrogen bond donors/acceptors, etc.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 mt-2 flex-shrink-0" />
                    <span>
                      <strong>Similarity search</strong>: Find molecules structurally similar to a query compound using SMILES notation
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 mt-2 flex-shrink-0" />
                    <span>
                      <strong>Specific molecule lookup</strong>: Get detailed information for molecules by ID
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  2. Structure-Based Analysis
                </h4>
                <p className="text-muted-foreground mt-1">
                  If you have specific molecules in mind, I can:
                </p>
              </div>
            </div>
          </AgentMessage>

          {/* Floating user avatar indicator */}
          <div className="fixed right-6 top-1/2 -translate-y-1/2">
            <UserAvatar name="" size="lg" showName={false} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <ChatInput />
    </div>
  );
};

export default ChatArea;
