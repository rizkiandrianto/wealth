const SCRIPT = `(function(){try{var k='theme';var s=localStorage.getItem(k)||'system';var t=s==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s;var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.style.colorScheme=t;}catch(e){}})();`

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
}
