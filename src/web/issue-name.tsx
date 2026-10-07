import { useLayoutEffect, useRef } from 'react';
import { Textarea } from './components/ui/textarea.js';

export function IssueName({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function resize() {
    const element = ref.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }
  useLayoutEffect(resize, [value]);
  useLayoutEffect(() => {
    const element = ref.current!;
    let width = element.clientWidth;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === width) return;
      width = entry.contentRect.width;
      resize();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <Textarea ref={ref} rows={1} wrap="soft" className="issue-name field-sizing-fixed min-h-0 resize-none overflow-hidden rounded-sm border-0 bg-transparent px-0 text-2xl leading-snug font-semibold shadow-none md:text-2xl dark:bg-transparent" aria-label="Issue 名称" value={value}
    onChange={event => onChange(event.target.value.replace(/[\r\n]+/g, ' '))}
    onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) event.preventDefault(); }} />;
}
