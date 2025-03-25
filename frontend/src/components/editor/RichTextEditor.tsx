"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Paragraph from "@tiptap/extension-paragraph";
import Image from "@tiptap/extension-image";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  shouldAutoSave?: boolean;
  onSaveContent?: () => void; // New prop to trigger manual save from parent
}

// Create a type for the editor ref handle
export interface EditorRefHandle {
  getContent: () => string;
  saveContent: () => void;
}

export const RichTextEditor = forwardRef<EditorRefHandle, RichTextEditorProps>(({
  content,
  onChange,
  placeholder = "Start writing your article...",
  shouldAutoSave = false,
  onSaveContent,
}, ref) => {
  const [isMounted, setIsMounted] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const editorContentRef = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Paragraph,
      Image,
      TextStyle,
      Underline,
      Highlight,
      Blockquote,
      CodeBlock,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] p-4 border rounded-md focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none",
        id: "rich-text-editor", // Add ID to the editor
      },
    },
    onUpdate: ({ editor }) => {
      // Always store the current content in our ref
      const html = editor.getHTML();
      editorContentRef.current = html;
      
      // Only call onChange (which triggers API calls) when auto-save is enabled
      if (shouldAutoSave) {
        onChange(html);
      }
    },
  });

  // Run on client only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);
  
  // Effect to synchronize content but not trigger auto-save
  useEffect(() => {
    return () => {
      // On component unmount, always ensure latest content is saved
      if (!shouldAutoSave && editorContentRef.current && editorContentRef.current !== content) {
        onChange(editorContentRef.current);
      }
    };
  }, [onChange, content, shouldAutoSave]);

  // Add a function to get the current content
  const getContent = useCallback(() => {
    if (editor) {
      const html = editor.getHTML();
      editorContentRef.current = html;
      return html;
    }
    return editorContentRef.current;
  }, [editor]);

  // Add a function to save content
  const saveContent = useCallback(() => {
    const currentContent = getContent();
    onChange(currentContent);
    if (onSaveContent) {
      onSaveContent();
    }
  }, [getContent, onChange, onSaveContent]);

  // Expose methods to parent through ref
  useImperativeHandle(ref, () => ({
    getContent,
    saveContent
  }), [getContent, saveContent]);

  const addImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (editor && imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageInput(false);
    }
  }, [editor, imageUrl]);

  if (!isMounted) {
    return null;
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor">
      <div className="flex flex-wrap gap-1 mb-2 bg-muted p-1 rounded-md">
        <Tooltip content="Bold">
          <Button
            variant={editor.isActive("bold") ? "default" : "outline"}
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBold().run();
            }}
            className="h-8 w-8"
          >
            <Bold className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Italic">
          <Button
            variant={editor.isActive("italic") ? "default" : "outline"}
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleItalic().run();
            }}
            className="h-8 w-8"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Underline">
          <Button
            variant={editor.isActive("underline") ? "default" : "outline"}
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleUnderline().run();
            }}
            className="h-8 w-8"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Heading 1">
          <Button
            variant={editor.isActive("heading", { level: 1 }) ? "default" : "outline"}
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }}
            className="h-8 w-8"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Heading 2">
          <Button
            variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"}
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
            className="h-8 w-8"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Heading 3">
          <Button
            variant={editor.isActive("heading", { level: 3 }) ? "default" : "outline"}
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
            className="h-8 w-8"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Bullet List">
          <Button
            variant={editor.isActive("bulletList") ? "default" : "outline"}
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBulletList().run();
            }}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Ordered List">
          <Button
            variant={editor.isActive("orderedList") ? "default" : "outline"}
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleOrderedList().run();
            }}
            className="h-8 w-8"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Quote">
          <Button
            variant={editor.isActive("blockquote") ? "default" : "outline"}
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBlockquote().run();
            }}
            className="h-8 w-8"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Code Block">
          <Button
            variant={editor.isActive("codeBlock") ? "default" : "outline"}
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleCodeBlock().run();
            }}
            className="h-8 w-8"
          >
            <Code className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Insert Image">
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowImageInput(!showImageInput);
            }}
            className="h-8 w-8"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      {showImageInput && (
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              addImage();
            }}
            disabled={!imageUrl}
          >
            Add Image
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              setShowImageInput(false);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      <EditorContent editor={editor} className="border rounded-md" />
    </div>
  );
}); 