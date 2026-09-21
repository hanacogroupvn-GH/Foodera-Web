import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import { Node as TiptapNode, mergeAttributes } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Table2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  X,
  Code,
  Upload,
  Megaphone,
} from 'lucide-react';
import { uploadCmsImage } from '../lib/storageUploads';

// ── CTA Button — Custom Tiptap Node ───────────────────────
const CtaButtonNode = TiptapNode.create({
  name: 'ctaButton',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      text: { default: 'Contact Us' },
      link: { default: '/contact' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-cta]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-cta': 'true', class: 'cta-block' }, HTMLAttributes),
      [
        'a',
        { href: HTMLAttributes.link, class: 'cta-link' },
        HTMLAttributes.text,
      ],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor: editorInstance }) => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-cta', 'true');
      wrapper.className = [
        'my-6 rounded-2xl p-6 text-center cursor-pointer select-none',
        'bg-gradient-to-r from-[#1a4731] to-[#1a4731]/80 border-2 border-transparent',
        'hover:border-foodera-lime/60 transition-all group',
      ].join(' ');

      const label = document.createElement('p');
      label.className = 'text-[10px] font-black uppercase tracking-widest text-white/50 mb-2';
      label.textContent = 'CTA BUTTON';

      const text = document.createElement('p');
      text.className = 'text-white text-base font-bold mb-2';
      text.textContent = node.attrs.text;

      const link = document.createElement('p');
      link.className = 'text-xs font-mono text-foodera-lime/80';
      link.textContent = `→ ${node.attrs.link}`;

      wrapper.appendChild(label);
      wrapper.appendChild(text);
      wrapper.appendChild(link);

      // Click to delete
      wrapper.title = 'Double-click to delete this CTA button';
      wrapper.addEventListener('dblclick', () => {
        if (typeof getPos === 'function') {
          const pos = getPos();
          editorInstance.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
        }
      });

      return { dom: wrapper };
    };
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Article slug or ID used for image upload path */
  articleSlug?: string;
  onImageUploadError?: (message: string) => void;
}

// ── Toolbar Button ─────────────────────────────────────────
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, isActive, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all text-sm ${
      isActive
        ? 'bg-foodera-forest text-white shadow-sm'
        : 'text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest'
    } disabled:opacity-30 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

// ── Separator ─────────────────────────────────────────────
const ToolbarSep: React.FC = () => (
  <div className="w-px h-6 bg-gray-200 mx-0.5 flex-shrink-0" />
);

// ── Link Dialog ───────────────────────────────────────────
interface LinkDialogProps {
  editor: Editor;
  onClose: () => void;
}

const LinkDialog: React.FC<LinkDialogProps> = ({ editor, onClose }) => {
  const [url, setUrl] = React.useState(editor.getAttributes('link').href || '');
  const [openInNewTab, setOpenInNewTab] = React.useState(true);

  const handleApply = () => {
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url.trim(), target: openInNewTab ? '_blank' : undefined }).run();
    }
    onClose();
  };

  const handleRemove = () => {
    editor.chain().focus().unsetLink().run();
    onClose();
  };

  return (
    <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Insert Link</span>
        <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
          <X size={14} />
        </button>
      </div>
      <input
        autoFocus
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); if (e.key === 'Escape') onClose(); }}
        placeholder="https://..."
        className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-foodera-forest/30"
      />
      <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={openInNewTab}
          onChange={(e) => setOpenInNewTab(e.target.checked)}
          className="rounded"
        />
        Open in new tab
      </label>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 px-3 py-2 bg-foodera-forest text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foodera-lime hover:text-foodera-forest transition-all"
        >
          Apply
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={handleRemove}
            className="px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all"
          >
            Remove link
          </button>
        )}
      </div>
    </div>
  );
};

// ── Image Dialog ──────────────────────────────────────────
interface ImageDialogProps {
  editor: Editor;
  onClose: () => void;
  articleSlug?: string;
  onUploadError?: (msg: string) => void;
}

const ImageDialog: React.FC<ImageDialogProps> = ({ editor, onClose, articleSlug, onUploadError }) => {
  const [url, setUrl] = React.useState('');
  const [alt, setAlt] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertImage = (src: string, altText: string) => {
    editor.chain().focus().setImage({ src, alt: altText || undefined }).run();
    onClose();
  };

  const handleUrlInsert = () => {
    if (!url.trim()) return;
    insertImage(url.trim(), alt);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      const publicUrl = await uploadCmsImage(file, [
        'news',
        articleSlug || 'inline',
        'content'
      ]);
      insertImage(publicUrl, alt || file.name.replace(/\.[^.]+$/, ''));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Upload failed';
      onUploadError?.(errMsg);
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="absolute top-full left-0 mt-2 z-50 w-96 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Insert Image</span>
        <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
          <X size={14} />
        </button>
      </div>

      {/* Upload from computer */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-foodera-forest/40 hover:bg-foodera-forest/5 transition-all"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Upload size={20} className="mx-auto mb-2 text-gray-400" />
        <p className="text-xs font-bold text-gray-500">
          {isUploading ? 'Uploading...' : 'Upload image from computer'}
        </p>
        <p className="text-[10px] text-gray-400">JPG, PNG, WebP — max 5MB</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[10px] text-gray-400 font-bold">or enter URL</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleUrlInsert(); if (e.key === 'Escape') onClose(); }}
        placeholder="https://example.com/image.jpg"
        className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-foodera-forest/30"
      />
      <input
        type="text"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        placeholder="Alt text (SEO) — image description"
        className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-foodera-forest/30"
      />
      <button
        type="button"
        onClick={handleUrlInsert}
        disabled={!url.trim()}
        className="w-full px-3 py-2 bg-foodera-forest text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foodera-lime hover:text-foodera-forest transition-all disabled:opacity-40"
      >
        Insert image from URL
      </button>
    </div>
  );
};

// ── CTA Button Dialog ─────────────────────────────────────
interface CtaButtonDialogProps {
  editor: Editor;
  onClose: () => void;
}

const CtaButtonDialog: React.FC<CtaButtonDialogProps> = ({ editor, onClose }) => {
  const [text, setText] = React.useState('Contact Us');
  const [link, setLink] = React.useState('/contact');

  const handleInsert = () => {
    if (!text.trim() || !link.trim()) return;
    editor.chain().focus().insertContent({
      type: 'ctaButton',
      attrs: { text: text.trim(), link: link.trim() },
    }).run();
    onClose();
  };

  return (
    <div
      className="absolute top-full left-0 mt-2 z-50 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Insert CTA Button</span>
        <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
          <X size={14} />
        </button>
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Button text</label>
        <input
          autoFocus
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleInsert(); if (e.key === 'Escape') onClose(); }}
          placeholder="Contact Us"
          className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-foodera-forest/30"
        />
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Target URL</label>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleInsert(); if (e.key === 'Escape') onClose(); }}
          placeholder="/contact or https://..."
          className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-foodera-forest/30"
        />
      </div>
      <button
        type="button"
        onClick={handleInsert}
        disabled={!text.trim() || !link.trim()}
        className="w-full px-3 py-2 bg-foodera-forest text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foodera-lime hover:text-foodera-forest transition-all disabled:opacity-40"
      >
        Insert CTA Button
      </button>
      <p className="text-[10px] text-gray-400 text-center">Double-click block to delete</p>
    </div>
  );
};

// ── Main RichTextEditor Component ─────────────────────────
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write article content...',
  articleSlug,
  onImageUploadError,
}) => {
  const [showLinkDialog, setShowLinkDialog] = React.useState(false);
  const [showImageDialog, setShowImageDialog] = React.useState(false);
  const [showCtaDialog, setShowCtaDialog] = React.useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  // Force re-render on selection/transaction changes so toolbar buttons reflect cursor position
  const [, setTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { languageClassPrefix: 'language-' },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-foodera-forest underline hover:text-foodera-lime transition-colors',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full h-auto my-6 border border-gray-100',
        },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CtaButtonNode,
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      // Emit empty string when editor is empty (just <p></p>)
      onChange(html === '<p></p>' ? '' : html);
    },
    // Re-render toolbar on every transaction (cursor move, selection change, etc.)
    onTransaction: () => {
      setTick((t) => t + 1);
    },
    editorProps: {
      attributes: {
        class: [
          'min-h-[420px] px-6 py-5 outline-none',
          'prose prose-lg max-w-none',
          // Headings
          'prose-h1:text-3xl prose-h1:font-black prose-h1:text-gray-900 prose-h1:mt-8 prose-h1:mb-4',
          'prose-h2:text-2xl prose-h2:font-black prose-h2:text-gray-800 prose-h2:mt-6 prose-h2:mb-3',
          'prose-h3:text-xl prose-h3:font-bold prose-h3:text-gray-700 prose-h3:mt-5 prose-h3:mb-2',
          // Paragraphs
          'prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4',
          // Lists
          'prose-ul:pl-6 prose-ol:pl-6 prose-li:text-gray-700 prose-li:mb-1',
          // Blockquote
          'prose-blockquote:border-l-4 prose-blockquote:border-foodera-forest prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600',
          // Links
          'prose-a:text-foodera-forest prose-a:underline prose-a:hover:text-foodera-lime',
          // Code
          'prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-sm',
          // Table
          'prose-table:border-collapse prose-table:w-full',
          'prose-th:border prose-th:border-gray-200 prose-th:px-4 prose-th:py-2 prose-th:bg-gray-50 prose-th:font-bold prose-th:text-left',
          'prose-td:border prose-td:border-gray-200 prose-td:px-4 prose-td:py-2',
          // HR
          'prose-hr:border-gray-200 prose-hr:my-8',
          // Placeholder
          '[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child]:before:text-gray-400 [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:pointer-events-none',
        ].join(' '),
      },
    },
  });

  // Sync external value changes (e.g., draft restore)
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const normalized = current === '<p></p>' ? '' : current;
    if (value !== normalized) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleTableInsert = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  // Close dialogs when clicking outside toolbar area
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as globalThis.Node)) {
        setShowLinkDialog(false);
        setShowImageDialog(false);
        setShowCtaDialog(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const wordCount = editor.storage.characterCount?.words?.() ?? 0;
  const charCount = editor.storage.characterCount?.characters?.() ?? 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 220));

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-visible focus-within:border-foodera-forest/30 transition-colors bg-white">
      {/* ── Bubble Menu (inline selection toolbar) ─────── */}
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-1 bg-gray-900 rounded-xl px-2 py-1.5 shadow-xl"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${editor.isActive('bold') ? 'text-foodera-lime' : 'text-white hover:text-foodera-lime'}`}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${editor.isActive('italic') ? 'text-foodera-lime' : 'text-white hover:text-foodera-lime'}`}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${editor.isActive('underline') ? 'text-foodera-lime' : 'text-white hover:text-foodera-lime'}`}
        >
          <UnderlineIcon size={14} />
        </button>
        <div className="w-px h-4 bg-gray-700 mx-0.5" />
        <button
          type="button"
          onClick={() => { setShowLinkDialog(true); setShowImageDialog(false); }}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('link') ? 'text-foodera-lime' : 'text-white hover:text-foodera-lime'}`}
        >
          <LinkIcon size={14} />
        </button>
      </BubbleMenu>

      {/* ── Main Toolbar ───────────────────────────────── */}
      <div ref={toolbarRef} className="relative">
        <div className="flex flex-wrap items-center gap-0.5 p-2 bg-gray-50 border-b border-gray-200 rounded-t-xl">
          {/* Undo / Redo */}
          <ToolbarButton title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo2 size={16} />
          </ToolbarButton>
          <ToolbarButton title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo2 size={16} />
          </ToolbarButton>

          <ToolbarSep />


          {/* Headings + Paragraph reset */}
          <ToolbarButton title="Paragraph (P)" isActive={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
            <span style={{ fontWeight: 700, fontSize: 14, lineHeight: 1 }}>P</span>
          </ToolbarButton>
          <ToolbarButton title="Heading 1" isActive={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton title="Heading 2" isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton title="Heading 3" isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={16} />
          </ToolbarButton>


          <ToolbarSep />

          {/* Formatting */}
          <ToolbarButton title="Bold (Ctrl+B)" isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton title="Italic (Ctrl+I)" isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton title="Underline (Ctrl+U)" isActive={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" isActive={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={16} />
          </ToolbarButton>
          <ToolbarButton title="Inline Code" isActive={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code size={16} />
          </ToolbarButton>

          <ToolbarSep />

          {/* Lists */}
          <ToolbarButton title="Bullet List" isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton title="Numbered List" isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton title="Blockquote" isActive={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={16} />
          </ToolbarButton>

          <ToolbarSep />

          {/* Alignment */}
          <ToolbarButton title="Align Left" isActive={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton title="Align Center" isActive={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton title="Align Right" isActive={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight size={16} />
          </ToolbarButton>

          <ToolbarSep />

          {/* Link */}
          <div className="relative">
            <ToolbarButton
              title="Insert Link (Ctrl+K)"
              isActive={editor.isActive('link') || showLinkDialog}
              onClick={() => { setShowLinkDialog(v => !v); setShowImageDialog(false); }}
            >
              <LinkIcon size={16} />
            </ToolbarButton>
            {showLinkDialog && (
              <LinkDialog editor={editor} onClose={() => setShowLinkDialog(false)} />
            )}
          </div>

          {/* Image */}
          <div className="relative">
            <ToolbarButton
              title="Insert Image"
              isActive={showImageDialog}
              onClick={() => { setShowImageDialog(v => !v); setShowLinkDialog(false); }}
            >
              <ImageIcon size={16} />
            </ToolbarButton>
            {showImageDialog && (
              <ImageDialog
                editor={editor}
                onClose={() => setShowImageDialog(false)}
                articleSlug={articleSlug}
                onUploadError={onImageUploadError}
              />
            )}
          </div>

          {/* Table */}
          <ToolbarButton title="Insert Table" isActive={editor.isActive('table')} onClick={handleTableInsert}>
            <Table2 size={16} />
          </ToolbarButton>

          {/* Horizontal Rule */}
          <ToolbarButton title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={16} />
          </ToolbarButton>

          <ToolbarSep />

          {/* CTA Button */}
          <div className="relative">
            <ToolbarButton
              title="Insert CTA Button"
              isActive={showCtaDialog}
              onClick={() => { setShowCtaDialog(v => !v); setShowLinkDialog(false); setShowImageDialog(false); }}
            >
              <Megaphone size={16} />
            </ToolbarButton>
            {showCtaDialog && (
              <CtaButtonDialog
                editor={editor}
                onClose={() => setShowCtaDialog(false)}
              />
            )}
          </div>
        </div>

        {/* Table context menu when inside a table */}
        {editor.isActive('table') && (
          <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-[10px]">
            <span className="font-black text-amber-600 uppercase tracking-widest mr-1">Table:</span>
            <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="px-2 py-1 bg-white border border-amber-200 rounded-lg font-bold text-amber-700 hover:bg-amber-100 transition-colors">+ Column Before</button>
            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 bg-white border border-amber-200 rounded-lg font-bold text-amber-700 hover:bg-amber-100 transition-colors">+ Column After</button>
            <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="px-2 py-1 bg-white border border-amber-200 rounded-lg font-bold text-amber-700 hover:bg-amber-100 transition-colors">+ Row Above</button>
            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 bg-white border border-amber-200 rounded-lg font-bold text-amber-700 hover:bg-amber-100 transition-colors">+ Row Below</button>
            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-1 bg-white border border-red-200 rounded-lg font-bold text-red-500 hover:bg-red-50 transition-colors">− Delete Column</button>
            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-1 bg-white border border-red-200 rounded-lg font-bold text-red-500 hover:bg-red-50 transition-colors">− Delete Row</button>
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 bg-red-50 border border-red-200 rounded-lg font-bold text-red-600 hover:bg-red-100 transition-colors">✕ Delete Table</button>
          </div>
        )}
      </div>

      {/* ── Editor Content ─────────────────────────────── */}
      <EditorContent editor={editor} />

      {/* ── Status Bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-xl">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-gray-400">{wordCount} words</span>
          <span className="text-[10px] font-bold text-gray-400">{charCount} characters</span>
          <span className="text-[10px] font-bold text-gray-400">~{readTime} min read</span>
        </div>
        {wordCount > 0 && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            wordCount >= 300
              ? 'bg-green-50 text-green-600'
              : 'bg-amber-50 text-amber-600'
          }`}>
            {wordCount >= 300 ? '✓ SEO Content Ready' : `${300 - wordCount} words needed for SEO`}
          </span>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
