"use client";
import { useEffect, useRef, type RefObject } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import { tags as t } from "@lezer/highlight";
import { formatMarkdown, imageMarkdown, type FormatKind } from "@/lib/md-format";

// 부모(EditorShell)가 툴바 버튼·이미지 업로드 결과를 입력창에 반영할 때 쓰는 손잡이.
export type MarkdownInputApi = {
  format(kind: FormatKind): void;
  insertImage(url: string): void;
  focus(): void;
};

type Props = {
  initialValue: string;
  apiRef: RefObject<MarkdownInputApi | null>;
  onChange(value: string): void;
  // 입력창 스크롤 위치(0~1) — 미리보기를 같은 비율로 따라 내린다.
  onScrollRatio(ratio: number): void;
  onImageFiles(files: File[]): void;
};

// 마크다운 기호는 흐리게, 내용은 또렷하게 — velog 입력창의 결.
const highlight = HighlightStyle.define([
  { tag: t.heading1, fontSize: "1.6em", fontWeight: "800" },
  { tag: t.heading2, fontSize: "1.35em", fontWeight: "750" },
  { tag: t.heading3, fontSize: "1.15em", fontWeight: "700" },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: "700" },
  { tag: t.strong, fontWeight: "750" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: [t.link, t.url], color: "var(--accent)" },
  { tag: t.quote, color: "var(--dim)" },
  { tag: t.monospace, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.92em" },
  { tag: [t.processingInstruction, t.meta, t.contentSeparator], color: "var(--dim)" },
]);

const theme = EditorView.theme({
  "&": { height: "100%", color: "var(--fg)", backgroundColor: "transparent", fontSize: "1.05rem" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "1.75", overscrollBehavior: "contain" },
  ".cm-content": { caretColor: "var(--fg)", padding: "4px 0 40vh" },
  ".cm-line": { padding: "0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--fg)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "color-mix(in srgb, var(--accent) 22%, transparent)",
  },
  ".cm-placeholder": { color: "var(--dim)" },
});

function imageFiles(list: FileList | undefined | null): File[] {
  return [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
}

export default function MarkdownInput({ initialValue, apiRef, onChange, onScrollRatio, onImageFiles }: Props) {
  const host = useRef<HTMLDivElement>(null);
  // 최신 콜백을 ref에 두어, 콜백이 바뀔 때마다 CodeMirror를 다시 만들지 않는다.
  const handlers = useRef({ onChange, onScrollRatio, onImageFiles });
  useEffect(() => {
    handlers.current = { onChange, onScrollRatio, onImageFiles };
  });
  // 처음 마운트할 때의 값만 쓴다(입력창은 비제어). ref로 붙잡아 effect 의존성에서 뺀다.
  const initial = useRef(initialValue);

  useEffect(() => {
    if (!host.current) return;

    const runFormat = (view: EditorView, kind: FormatKind) => {
      const { from, to } = view.state.selection.main;
      const e = formatMarkdown(view.state.doc.toString(), from, to, kind);
      view.dispatch({
        changes: { from: e.from, to: e.to, insert: e.insert },
        selection: { anchor: e.selFrom, head: e.selTo },
        scrollIntoView: true,
      });
      view.focus();
      return true;
    };

    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.current,
        extensions: [
          history(),
          drawSelection(),
          EditorView.lineWrapping,
          markdown(),
          syntaxHighlighting(highlight),
          theme,
          placeholder("본문을 마크다운으로 쓰세요. 이미지는 붙여넣거나 끌어다 놓으면 올라가요."),
          keymap.of([
            { key: "Mod-b", run: (v) => runFormat(v, "bold") },
            { key: "Mod-i", run: (v) => runFormat(v, "italic") },
            { key: "Mod-k", run: (v) => runFormat(v, "link") },
            { key: "Mod-e", run: (v) => runFormat(v, "code") },
            { key: "Mod-Shift-x", run: (v) => runFormat(v, "strike") },
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) handlers.current.onChange(u.state.doc.toString());
          }),
          EditorView.domEventHandlers({
            paste(event) {
              const files = imageFiles(event.clipboardData?.files);
              if (files.length === 0) return false;
              event.preventDefault();
              handlers.current.onImageFiles(files);
              return true;
            },
            drop(event, v) {
              const files = imageFiles(event.dataTransfer?.files);
              if (files.length === 0) return false;
              event.preventDefault();
              // 놓은 자리에 커서를 옮겨 두면 업로드가 끝난 뒤 그 자리에 들어간다.
              const pos = v.posAtCoords({ x: event.clientX, y: event.clientY });
              if (pos !== null) v.dispatch({ selection: { anchor: pos } });
              handlers.current.onImageFiles(files);
              return true;
            },
          }),
        ],
      }),
    });

    const scroller = view.scrollDOM;
    const onScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      handlers.current.onScrollRatio(max > 0 ? scroller.scrollTop / max : 0);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });

    apiRef.current = {
      format: (kind) => runFormat(view, kind),
      insertImage: (url) => {
        const head = view.state.selection.main.head;
        const e = imageMarkdown(view.state.doc.toString(), head, url);
        view.dispatch({
          changes: e,
          selection: { anchor: e.from + e.insert.length },
          scrollIntoView: true,
        });
        view.focus();
      },
      focus: () => view.focus(),
    };

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      apiRef.current = null;
      view.destroy();
    };
  }, [apiRef]);

  return <div ref={host} className="ved-input" aria-label="본문 마크다운" />;
}
