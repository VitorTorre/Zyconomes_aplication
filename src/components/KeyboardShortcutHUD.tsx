import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Command, CheckCircle2 } from 'lucide-react';
import { ShortcutFeedback } from '../hooks/useKeyboardShortcuts';

interface Props {
  shortcut: ShortcutFeedback | null;
}

export const KeyboardShortcutHUD: React.FC<Props> = ({ shortcut }) => {
  return (
    <AnimatePresence>
      {shortcut && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-6 right-6 z-[100] bg-zinc-900/95 dark:bg-zinc-950/95 text-white border border-zinc-700/80 dark:border-zinc-800 shadow-2xl backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3 font-sans pointer-events-none"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Atalho do Engenheiro</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Command className="w-3 h-3" />
                {shortcut.combination}
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-100 mt-0.5">{shortcut.actionName}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
