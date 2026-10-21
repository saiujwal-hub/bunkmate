/** Shared chalk-styled control classes, so every button and input matches the board. */

export const chalkBtn =
  "rounded-lg border-[1.5px] border-dashed border-chalk/55 bg-transparent px-3 py-1 " +
  "font-hand text-[0.95rem] text-chalk/70 transition-colors duration-100 " +
  "hover:border-chalk hover:text-chalk " +
  "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-chalk/55 disabled:hover:text-chalk/70";

export const chalkBtnPlain =
  "rounded-lg bg-transparent px-2.5 py-1 font-hand text-[0.92rem] text-chalk/70 " +
  "transition-colors duration-100 hover:bg-chalk/10 hover:text-chalk";

export const chalkBtnDangerArmed =
  "border-solid border-chalkpink text-chalkpink hover:border-chalkpink hover:text-chalkpink";

export const chalkInput =
  "rounded-md border-b-2 border-dotted border-chalk/30 bg-transparent px-1.5 py-1 " +
  "font-hand text-lg leading-snug text-chalk outline-none " +
  "focus:border-chalky placeholder:text-chalk/25";

export const chalkLabel = "font-hand text-[0.85rem] text-chalk/55";
