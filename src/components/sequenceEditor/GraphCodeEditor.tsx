import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { useEffect, useMemo, useRef } from 'react';

import { diagnoseGraphText } from '../../sequences/graph/diagnose';

interface GraphCodeEditorProps {
  value: string;
  onChange: (text: string) => void;
  durationSec: number;
  /** Select and scroll to this range (a problem clicked in the list). A new object = a new jump. */
  reveal?: { from: number; to: number };
  label: string;
}

/**
 * The graph JSON, with codegen's checks as inline lint: JSON syntax from `@codemirror/lang-json`,
 * then the graph schema, expressions and times via `diagnoseGraphText`. Lives in the editor's
 * lazy chunk with all of CodeMirror.
 */
export default function GraphCodeEditor({
  value,
  onChange,
  durationSec,
  reveal,
  label,
}: GraphCodeEditorProps) {
  const ref = useRef<ReactCodeMirrorRef>(null);

  const extensions = useMemo(
    () => [
      json(),
      linter(jsonParseLinter()),
      linter(
        (view): Diagnostic[] => {
          const diagnosis = diagnoseGraphText(view.state.doc.toString(), durationSec);
          // Syntax errors come from the JSON linter above, at the right spot.
          if (diagnosis.jsonError) return [];
          return diagnosis.diagnostics.map((problem) => ({
            from: problem.from,
            to: Math.max(problem.from, problem.to),
            severity: 'error',
            message: problem.message,
          }));
        },
        { delay: 300 },
      ),
      lintGutter(),
      EditorView.contentAttributes.of({ 'aria-label': label }),
    ],
    [durationSec, label],
  );

  useEffect(() => {
    const view = ref.current?.view;
    if (!view || !reveal) return;
    const length = view.state.doc.length;
    view.dispatch({
      selection: { anchor: Math.min(reveal.from, length), head: Math.min(reveal.to, length) },
      scrollIntoView: true,
    });
    view.focus();
  }, [reveal]);

  return (
    <CodeMirror
      ref={ref}
      value={value}
      onChange={onChange}
      theme="dark"
      height="100%"
      className="h-full text-[13px]"
      extensions={extensions}
      basicSetup={{ foldGutter: true, highlightActiveLine: true }}
    />
  );
}
