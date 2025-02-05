
const Footer = () => {
  return (
    <footer className="w-full py-3 px-2 border-t dark:bg-background shadow-sm  bg-slate-100 outline-1">
      <div className="container flex items-center justify-center gap-3 text-lg text-slate-600 dark:text-muted-foreground">
        <a
          href="https://github.com/yam-1111/AutoMinimizer"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 hover:text-slate-900 dark:hover:text-foreground transition-colors"
        >

          <span className="text-sm font-medium">Made with ❤️ in 🇵🇭</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;