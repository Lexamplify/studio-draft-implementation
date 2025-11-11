import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Image from "@tiptap/extension-image";
import ImageResize from "tiptap-extension-resize-image";
import Underline from "@tiptap/extension-underline";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { FontSizeExtensions } from "@/extensions/font-size";
import { LineHeightExtension } from "@/extensions/line-height";

/**
 * TipTap extensions array for parsing HTML to JSON.
 * This is used when converting documents (e.g., DOCX) to TipTap format.
 * Note: Liveblocks extension is excluded as it's only needed at runtime.
 */
export const parsingExtensions = [
  StarterKit.configure({
    history: false,
  }),
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TaskList,
  Image,
  ImageResize,
  Underline,
  FontFamily,
  TextStyle,
  Color,
  LineHeightExtension.configure({
    types: ["heading", "paragraph"],
    defaultLineHeight: "1.5",
  }),
  FontSizeExtensions,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: "https",
  }),
  Highlight.configure({
    multicolor: true,
  }),
  TaskItem.configure({ nested: true }),
];

