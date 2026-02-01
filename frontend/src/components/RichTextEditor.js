import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import './RichTextEditor.css';

const MenuButton = ({ onClick, isActive, title, children }) => (
  <button
    type="button"
    className={`rte-btn ${isActive ? 'active' : ''}`}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
);

const Toolbar = ({ editor }) => {
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rte-toolbar">
      <div className="rte-toolbar-group">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          B
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <s>S</s>
        </MenuButton>
      </div>

      <div className="rte-toolbar-divider" />

      <div className="rte-toolbar-group">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </MenuButton>
      </div>

      <div className="rte-toolbar-divider" />

      <div className="rte-toolbar-group">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          &#8226; List
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          1. List
        </MenuButton>
      </div>

      <div className="rte-toolbar-divider" />

      <div className="rte-toolbar-group">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          &ldquo;
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          {'</>'}
        </MenuButton>
        <MenuButton onClick={setLink} isActive={editor.isActive('link')} title="Link">
          Link
        </MenuButton>
        <MenuButton onClick={addImage} isActive={false} title="Image">
          Img
        </MenuButton>
      </div>

      <div className="rte-toolbar-divider" />

      <div className="rte-toolbar-group">
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          isActive={false}
          title="Horizontal Rule"
        >
          &#8212;
        </MenuButton>
      </div>
    </div>
  );
};

const MinimalToolbar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="rte-toolbar">
      <div className="rte-toolbar-group">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          B
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </MenuButton>
      </div>

      <div className="rte-toolbar-divider" />

      <div className="rte-toolbar-group">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          &#8226; List
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          1. List
        </MenuButton>
      </div>
    </div>
  );
};

function RichTextEditor({ content = '', onChange, editable = true, placeholder = 'Start writing...', toolbar = 'full' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  return (
    <div className={`rte-container ${!editable ? 'rte-readonly' : ''}`}>
      {editable && (toolbar === 'minimal' ? <MinimalToolbar editor={editor} /> : <Toolbar editor={editor} />)}
      <EditorContent editor={editor} className="rte-content" />
    </div>
  );
}

export default RichTextEditor;
