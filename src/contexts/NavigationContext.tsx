import { createContext, useContext, useState, ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

// Skill injection payload
export interface SkillInjectionPayload {
  content: string;
  targetAgentId?: string;
  skillName: string;
}

interface NavigationContextType {
  breadcrumbItems: BreadcrumbItem[];
  setBreadcrumbItems: (items: BreadcrumbItem[]) => void;
  onShowBranchTree?: () => void;
  setOnShowBranchTree: (fn?: () => void) => void;
  onShowFileCenter?: () => void;
  setOnShowFileCenter: (fn?: () => void) => void;
  fileUnreadCount: number;
  setFileUnreadCount: (count: number) => void;
  onSendToAgent?: (query: string) => void;
  setOnSendToAgent: (fn?: (query: string) => void) => void;
  onNavigateToMessage?: (messageId: string) => void;
  setOnNavigateToMessage: (fn?: (messageId: string) => void) => void;
  isBranchTreeView: boolean;
  setIsBranchTreeView: (value: boolean) => void;
  onBackFromBranchTree?: () => void;
  setOnBackFromBranchTree: (fn?: () => void) => void;
  folderBranchId: string | null;
  setFolderBranchId: (branchId: string | null) => void;
  folderBranchName: string | null;
  setFolderBranchName: (branchName: string | null) => void;
  isFolderOpen: boolean;
  setIsFolderOpen: (isOpen: boolean) => void;
  contentWidth: number;
  setContentWidth: (width: number) => void;
  // Skill injection
  pendingSkillInjection: SkillInjectionPayload | null;
  injectSkill: (payload: SkillInjectionPayload) => void;
  clearSkillInjection: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);
  const [onShowBranchTree, setOnShowBranchTree] = useState<(() => void) | undefined>(undefined);
  const [onShowFileCenter, setOnShowFileCenter] = useState<(() => void) | undefined>(undefined);
  const [fileUnreadCount, setFileUnreadCount] = useState(0);
  const [onSendToAgent, setOnSendToAgent] = useState<((query: string) => void) | undefined>(undefined);
  const [onNavigateToMessage, setOnNavigateToMessage] = useState<((messageId: string) => void) | undefined>(undefined);
  const [isBranchTreeView, setIsBranchTreeView] = useState(false);
  const [onBackFromBranchTree, setOnBackFromBranchTree] = useState<(() => void) | undefined>(undefined);
  const [folderBranchId, setFolderBranchId] = useState<string | null>(null);
  const [folderBranchName, setFolderBranchName] = useState<string | null>(null);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [pendingSkillInjection, setPendingSkillInjection] = useState<SkillInjectionPayload | null>(null);

  const injectSkill = (payload: SkillInjectionPayload) => {
    setPendingSkillInjection(payload);
  };

  const clearSkillInjection = () => {
    setPendingSkillInjection(null);
  };

  return (
    <NavigationContext.Provider
      value={{
        breadcrumbItems,
        setBreadcrumbItems,
        onShowBranchTree,
        setOnShowBranchTree,
        onShowFileCenter,
        setOnShowFileCenter,
        fileUnreadCount,
        setFileUnreadCount,
        onSendToAgent,
        setOnSendToAgent,
        onNavigateToMessage,
        setOnNavigateToMessage,
        isBranchTreeView,
        setIsBranchTreeView,
        onBackFromBranchTree,
        setOnBackFromBranchTree,
        folderBranchId,
        setFolderBranchId,
        folderBranchName,
        setFolderBranchName,
        isFolderOpen,
        setIsFolderOpen,
        contentWidth,
        setContentWidth,
        pendingSkillInjection,
        injectSkill,
        clearSkillInjection,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};

