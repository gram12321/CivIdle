import { assert, test } from "vitest";
import { DEFAULT_SHORTCUTS } from "../shared/logic/ShortcutDefaults";

test("default keyboard shortcuts cover every shortcut action", () => {
   assert.equal(Object.keys(DEFAULT_SHORTCUTS).length, 18);
   assert.equal(DEFAULT_SHORTCUTS.BuildingPageUpgrade1.key, "1");
   assert.equal(DEFAULT_SHORTCUTS.BuildingPageToggleBuilding.key, "p");
   assert.equal(DEFAULT_SHORTCUTS.BuildingPageToggleBuildingSetAllSimilar.shift, true);
   assert.equal(DEFAULT_SHORTCUTS.UpgradePageIncreaseLevel.key, "ArrowUp");
   assert.equal(DEFAULT_SHORTCUTS.TechPageGoBackToCity.key, "Escape");
   assert.equal(DEFAULT_SHORTCUTS.EmptyTilePageBuildLastBuilding.key, "b");
   assert.equal(DEFAULT_SHORTCUTS.SendAnExplorer.key, "e");
});
