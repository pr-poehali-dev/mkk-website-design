import { useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  quickIcons?: boolean | string[];
}

const MODULES = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ['bold', 'italic', 'underline'],
    [{ color: [] }, { background: [] }],
    ['blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link'],
    ['clean'],
  ],
};

const DEFAULT_ICONS = ['✅', '🔔', '📄', '📌', '⚡', '🎉', '⏳', '💳', '📞', '🛡️'];

const RichTextEditor = ({ value, onChange, placeholder, className, quickIcons }: Props) => {
  const quillRef = useRef<ReactQuill>(null);

  const insertIcon = (icon: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    const index = range ? range.index : editor.getLength();
    editor.insertText(index, icon + ' ', 'user');
    editor.setSelection(index + icon.length + 1, 0);
  };

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={MODULES}
        placeholder={placeholder}
      />
      {quickIcons && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[11px] text-muted-foreground">Вставить иконку:</span>
          {(Array.isArray(quickIcons) ? quickIcons : DEFAULT_ICONS).map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => insertIcon(icon)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-sm hover:bg-secondary"
            >
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;