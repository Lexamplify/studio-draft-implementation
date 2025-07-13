import {
  Scale,
  Sparkles,
  BotMessageSquare,
  Archive,
  MessagesSquare,
  FileText,
  Search,
  Send,
  File as FileIcon,
  ThumbsUp,
  RefreshCw,
  LogOut,
  Settings,
  UserCircle,
  LayoutDashboard,
  Home,
  Briefcase,
  BookOpen,
  ClipboardEdit,
  ChevronDown,
  ChevronRight,
  Filter,
  PlusCircle,
  Edit3,
  Trash2,
  MoreVertical,
  X,
  Download,
  Eye,
  Save,
  Check,
  Shield,
  FolderKanban,
  Users,
  Lock,
  Plus,
  Paperclip,
  CalendarDays,
  FileEdit,
  FolderOpen,
  LibraryBig,
  Tags,
  School,
  ListTodo,
  LayoutGrid,
  CalendarRange,
  CalendarClock,
  CalendarPlus,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

// A helper type for icons that might take custom styling via className
export type IconType = React.FC<React.PropsWithChildren<LucideProps>>;

export const Icons = {
  Logo: (props: LucideProps) => (
    <div className="flex items-center gap-1">
      <Briefcase className="h-6 w-6 text-primary" {...props} />
      <span className="font-semibold text-xl text-primary group-data-[state=expanded]:inline hidden">LegalEase</span>
      <Sparkles className="h-5 w-5 text-accent group-data-[state=expanded]:inline hidden" {...props} />
    </div>
  ),
  Assistant: BotMessageSquare as IconType,
  Vault: Archive as IconType,
  Chat: MessagesSquare as IconType,
  Draft: ClipboardEdit as IconType,
  Search: Search as IconType,
  Send: Send as IconType,
  File: FileIcon as IconType,
  CaseFile: BookOpen as IconType, // Used for "Generate Citations" action button
  Template: FileText as IconType, // Used for "Summarize Document" action button
  GeneratedDraft: FileIcon as IconType,
  AiSuggest: Sparkles as IconType,
  Citation: ThumbsUp as IconType,
  Rephrase: RefreshCw as IconType, // Used for "Translate Document" action button
  Logout: LogOut as IconType,
  Settings: Settings as IconType,
  User: UserCircle as IconType,
  Dashboard: LayoutDashboard as IconType,
  Home: Home as IconType,
  Sparkles: Sparkles as IconType,
  ChevronDown: ChevronDown as IconType,
  ChevronRight: ChevronRight as IconType,
  Filter: Filter as IconType,
  PlusCircle: PlusCircle as IconType,
  Edit: Edit3 as IconType,
  Trash: Trash2 as IconType,
  MoreVertical: MoreVertical as IconType,
  Close: X as IconType,
  Download: Download as IconType,
  View: Eye as IconType,
  Save: Save as IconType,
  Check: Check as IconType,
  Shield: Shield as IconType,
  BookOpen: BookOpen as IconType,
  ProjectFolder: FolderKanban as IconType,
  Users: Users as IconType,
  Lock: Lock as IconType,
  Plus: Plus as IconType,
  Paperclip: Paperclip as IconType,
  Calendar: CalendarDays as IconType, // General Calendar icon
  FileEdit: FileEdit as IconType,
  FolderOpen: FolderOpen as IconType,
  LibraryBig: LibraryBig as IconType,
  Tags: Tags as IconType,
  School: School as IconType,
  ListTodo: ListTodo as IconType,
  CalendarMonthView: LayoutGrid as IconType,
  CalendarWeekView: CalendarRange as IconType,
  CalendarDayView: CalendarClock as IconType,
  CalendarPlus: CalendarPlus as IconType,
  RefreshCw: RefreshCw as IconType,
  Scale: Scale as IconType, // Used for "Generate Arguments" action button
  FileText: FileText as IconType, // Explicitly add for Summarize Document
  Google: (props: LucideProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath="url(#clip0_17_40)">
        <path d="M23.766 12.276c0-.818-.074-1.604-.213-2.356H12.24v4.451h6.484a5.54 5.54 0 01-2.4 3.632v3.01h3.877c2.27-2.09 3.565-5.17 3.565-8.737z" fill="#4285F4"/>
        <path d="M12.24 24c3.24 0 5.963-1.07 7.95-2.91l-3.877-3.01c-1.08.72-2.46 1.15-4.073 1.15-3.13 0-5.78-2.11-6.73-4.95H1.54v3.09A11.997 11.997 0 0012.24 24z" fill="#34A853"/>
        <path d="M5.51 14.28A7.19 7.19 0 014.8 12c0-.79.14-1.56.39-2.28V6.63H1.54A12.01 12.01 0 000 12c0 1.89.45 3.68 1.54 5.37l3.97-3.09z" fill="#FBBC05"/>
        <path d="M12.24 4.77c1.77 0 3.36.61 4.61 1.8l3.44-3.44C18.2 1.07 15.48 0 12.24 0A11.997 11.997 0 001.54 6.63l3.97 3.09c.95-2.84 3.6-4.95 6.73-4.95z" fill="#EA4335"/>
      </g>
      <defs>
        <clipPath id="clip0_17_40">
          <path fill="#fff" d="M0 0h24v24H0z"/>
        </clipPath>
      </defs>
    </svg>
  ),
};
