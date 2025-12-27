import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Agent, AVAILABLE_AGENTS } from "@/lib/agents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AgentSelectorProps {
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
}

const AgentSelector = ({ selectedAgent, onSelectAgent }: AgentSelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-curve-hover transition-colors text-sm">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs",
              selectedAgent.color
            )}
          >
            {selectedAgent.icon}
          </div>
          <span className="text-foreground font-medium">{selectedAgent.name}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {AVAILABLE_AGENTS.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onClick={() => {
              onSelectAgent(agent);
              setOpen(false);
            }}
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0",
                agent.color
              )}
            >
              {agent.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{agent.name}</span>
                {agent.id === selectedAgent.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {agent.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AgentSelector;
