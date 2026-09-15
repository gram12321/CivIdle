import type { IShortcutConfig, Shortcut } from "./Shortcut";

function shortcut(key: string, modifiers: Partial<Omit<IShortcutConfig, "key">> = {}): IShortcutConfig {
   return {
      key,
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
      ...modifiers,
   };
}

/** The bindings used for new games and added once to existing saves. */
export const DEFAULT_SHORTCUTS: Record<Shortcut, IShortcutConfig> = {
   ShortcutPageSave: shortcut("s"),
   ShortcutPageClear: shortcut("c"),
   BuildingPageSellBuilding: shortcut("Delete"),
   BuildingPageUpgrade1: shortcut("1"),
   BuildingPageUpgrade2: shortcut("2"),
   BuildingPageUpgrade3: shortcut("3"),
   BuildingPageUpgrade4: shortcut("4"),
   BuildingPageUpgrade5: shortcut("5"),
   BuildingPageToggleBuilding: shortcut("v"),
   BuildingPageToggleBuildingSetAllSimilar: shortcut("v", { shift: true }),
   UpgradePageIncreaseLevel: shortcut("1"),
   UpgradePageDecreaseLevel: shortcut("½"),
   UpgradePageEndConstruction: shortcut("Enter"),
   UpgradePageCancelUpgrade: shortcut("x"),
   UpgradePageCancelAllUpgrades: shortcut("x", { shift: true }),
   TechPageGoBackToCity: shortcut("Escape"),
   TechPageUnlockTech: shortcut("Enter"),
   WorldPageMoveSelectedTileUpLeft: shortcut("Numpad7"),
   WorldPageMoveSelectedTileUpRight: shortcut("Numpad9"),
   WorldPageMoveSelectedTileLeft: shortcut("Numpad4"),
   WorldPageMoveSelectedTileRight: shortcut("Numpad6"),
   WorldPageMoveSelectedTileDownLeft: shortcut("Numpad1"),
   WorldPageMoveSelectedTileDownRight: shortcut("Numpad3"),
   WorldPagePanMapUp: shortcut("Numpad8"),
   WorldPagePanMapDown: shortcut("Numpad2"),
   WorldPagePanMap: shortcut("Numpad5"),
   EmptyTilePageBuildLastBuilding: shortcut("b"),
   EmptyTilePageFilterWonder: shortcut("w"),
   EmptyTilePageFilterTier1: shortcut("1"),
   EmptyTilePageFilterTier2: shortcut("2"),
   EmptyTilePageFilterTier3: shortcut("3"),
   EmptyTilePageFilterTier4: shortcut("4"),
   EmptyTilePageFilterTier5: shortcut("5"),
   EmptyTilePageFilterTier6: shortcut("6"),
   EmptyTilePageFilterTier7: shortcut("7"),
   EmptyTilePageFilterTier8: shortcut("8"),
   SendAnExplorer: shortcut("e"),
   PlayerMapPageGoBackToCity: shortcut("Escape"),
};
