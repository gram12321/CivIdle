import type { GreatPerson } from "../../shared/definitions/GreatPersonDefinitions";
import { findSpecialBuildingCached } from "../../shared/logic/BuildingLogic";
import { Config } from "../../shared/logic/Config";
import { MigrationFlags, RankUpFlags, ThemeColorNames, type SavedGame } from "../../shared/logic/GameState";
import { getGrid } from "../../shared/logic/IntraTickCache";
import { getTotalGreatPeopleUpgradeCost } from "../../shared/logic/RebirthLogic";
import { ShortcutActions } from "../../shared/logic/Shortcut";
import { DEFAULT_SHORTCUTS } from "../../shared/logic/ShortcutDefaults";
import { BuildingInputMode, ResourceImportOptions, makeBuilding } from "../../shared/logic/Tile";
import {
   forEach,
   hasFlag,
   isNullOrUndefined,
   pointToTile,
   safeAdd,
   setFlag,
   tileToPoint,
} from "../../shared/utilities/Helper";
import { getConstructionPriority, getProductionPriority } from "./Global";

const LEGACY_WORLD_SHORTCUT_KEYS = {
   WorldPageMoveSelectedTileUpLeft: "7",
   WorldPageMoveSelectedTileUpRight: "9",
   WorldPageMoveSelectedTileLeft: "4",
   WorldPageMoveSelectedTileRight: "6",
   WorldPageMoveSelectedTileDownLeft: "1",
   WorldPageMoveSelectedTileDownRight: "3",
   WorldPagePanMapUp: "8",
   WorldPagePanMapDown: "2",
   WorldPagePanMap: "5",
} as const;

export function migrateSavedGame(save: SavedGame) {
   // This has to be before `getGrid` is called because getGrid requires extraTileSize to work correctly!
   if (!Number.isFinite(save.current.mapSize)) {
      save.current.mapSize = Config.City[save.current.city].sizeOld ?? Config.City[save.current.city].size;
   }

   const grid = getGrid(save.current);
   grid.forEach((point) => {
      const xy = pointToTile(point);
      if (save.current.tiles.has(xy)) return;
      save.current.tiles.set(xy, {
         tile: xy,
         deposit: {},
         explored: false,
      });
   });
   if ("Skyscrapper" in save.current.unlockedTech) {
      delete save.current.unlockedTech.Skyscrapper;
      save.current.unlockedTech.Skyscraper = true;
   }
   if (!save.current.tradeValue) {
      save.current.tradeValue = 0;
   }

   save.current.tiles.forEach((tile, xy) => {
      if (!grid.isValid(tileToPoint(xy))) {
         save.current.tiles.delete(xy);
         return;
      }
      if (tile.building) {
         // @ts-expect-error
         if (tile.building.type === "Cathedral") {
            delete tile.building;
            return;
         }
         // @ts-expect-error
         if (tile.building.type === "DiaryFarm") {
            tile.building.type = "DairyFarm";
         }
         // @ts-expect-error
         if (tile.building.status === "paused") {
            tile.building.status = "building";
         }
         if (tile.building.type === "Petra") {
            if ("speedUp" in tile.building) {
               save.current.speedUp = tile.building.speedUp as number;
               delete tile.building.speedUp;
            }
            if ("offlineProductionPercent" in tile.building) {
               save.options.offlineProductionPercent = tile.building.offlineProductionPercent as number;
               delete tile.building.offlineProductionPercent;
            }
            if (Number.isFinite(tile.building.resources.Warp)) {
               const hq = findSpecialBuildingCached("Headquarter", save.current);
               if (hq) {
                  safeAdd(hq.building.resources, "Warp", tile.building.resources.Warp ?? 0);
               }
               delete tile.building.resources.Warp;
            }
         }
         // @ts-expect-error
         if (tile.building.disabledInput) {
            // @ts-expect-error
            delete tile.building.disabledInput;
         }
         tile.tile = xy;
         if (isNullOrUndefined(tile.building.suspendedInput)) {
            tile.building.suspendedInput = new Map();
         }
         if (isNullOrUndefined(tile.building.inputMode)) {
            tile.building.inputMode = BuildingInputMode.Distance;
         }
         if (isNullOrUndefined(tile.building.maxInputDistance)) {
            tile.building.maxInputDistance = Number.POSITIVE_INFINITY;
         }
         if (isNullOrUndefined(tile.building.productionPriority)) {
            // @ts-expect-error
            tile.building.productionPriority = getProductionPriority(tile.building.priority);
         }
         if (isNullOrUndefined(tile.building.constructionPriority)) {
            // @ts-expect-error
            tile.building.constructionPriority = getConstructionPriority(tile.building.priority);
         }
         // @ts-expect-error
         delete tile.building.priority;
         if ("resourceImports" in tile.building && !("resourceImportOptions" in tile.building)) {
            // @ts-expect-error
            tile.building.resourceImportOptions = ResourceImportOptions.None;
         }
         if (!Config.Building[tile.building.type]) {
            delete tile.building;
            return;
         }
         tile.building = makeBuilding(tile.building);
         forEach(tile.building.resources, (res, amount) => {
            if (!Config.Material[res] || !Number.isFinite(amount)) {
               delete tile.building!.resources[res];
            }
         });
      }
   });

   if ("transportationV2" in save.current) {
      delete save.current.transportationV2;
   }

   forEach(save.options.buildingDefaults, (building, d) => {
      if (!Config.Building[building]) {
         delete save.options.buildingDefaults[building];
      }
   });

   forEach(save.options.buildingColors, (building) => {
      if (!Config.Building[building]) {
         delete save.options.buildingColors[building];
      }
   });

   forEach(save.options.resourceColors, (resource) => {
      if (!Config.Material[resource]) {
         delete save.options.resourceColors[resource];
      }
   });

   forEach(save.options.themeColors, (color) => {
      if (!ThemeColorNames[color]) {
         delete save.options.themeColors[color];
      }
   });

   if ("transportation" in save.current) {
      delete save.current.transportation;
   }

   if (isNullOrUndefined(save.options.defaultProductionPriority)) {
      // @ts-expect-error
      save.options.defaultProductionPriority = getProductionPriority(save.options.defaultPriority);
   }
   if (isNullOrUndefined(save.options.defaultConstructionPriority)) {
      // @ts-expect-error
      save.options.defaultConstructionPriority = getConstructionPriority(save.options.defaultPriority);
   }
   if (isNullOrUndefined(save.options.chatChannels) || save.options.chatChannels.size === 0) {
      save.options.chatChannels = new Set();
      // @ts-expect-error
      if (save.options.chatSendChannel) {
         // @ts-expect-error
         save.options.chatChannels.add(save.options.chatSendChannel);
      } else {
         save.options.chatChannels.add("en");
      }
   }
   // @ts-expect-error
   delete save.options.buildingColors.Cathedral;
   // @ts-expect-error
   delete save.options.buildingDefaults.Cathedral;
   forEach(save.options.greatPeople, (k, v) => {
      if (!Config.GreatPerson[k]) {
         delete save.options.greatPeople[k];
      }
   });
   forEach(save.options.shortcuts, (k) => {
      if (!(k in ShortcutActions)) {
         delete save.options.shortcuts[k];
      }
   });
   // @ts-expect-error
   delete save.options.chatSendChannel;
   // @ts-expect-error
   delete save.options.chatReceiveChannel;
   // @ts-expect-error
   delete save.options.defaultPriority;
   forEach(save.options.buildingDefaults, (building, d) => {
      forEach(d, (k, v) => {
         if (isNullOrUndefined(v)) {
            delete d[k];
         }
      });
   });
   if (isNullOrUndefined(save.options.greatPeopleChoicesV2)) {
      save.options.greatPeopleChoicesV2 = [];
   }
   if ("greatPeopleChoices" in save.options) {
      (save.options.greatPeopleChoices as GreatPerson[][]).forEach((c) => {
         save.options.greatPeopleChoicesV2.push({ choices: c, amount: 1 });
      });
      delete save.options.greatPeopleChoices;
   }
   if ("greatPeopleChoices" in save.current) {
      (save.current.greatPeopleChoices as GreatPerson[][]).forEach((c) => {
         save.current.greatPeopleChoicesV2.push({ choices: c, amount: 1 });
      });
      delete save.current.greatPeopleChoices;
   }

   if (!hasFlag(save.options.migrationFlags, MigrationFlags.ZenobiaMigrated)) {
      save.options.migrationFlags = setFlag(save.options.migrationFlags, MigrationFlags.ZenobiaMigrated);
      const classicalAgeWisdom = save.options.ageWisdom.ClassicalAge;
      if (classicalAgeWisdom && classicalAgeWisdom > 0) {
         let result = 0;
         for (let i = 1; i <= classicalAgeWisdom; i++) {
            result += getTotalGreatPeopleUpgradeCost("Zenobia", i);
         }
         if (save.options.greatPeople.Zenobia) {
            save.options.greatPeople.Zenobia.amount += result;
         } else {
            save.options.greatPeople.Zenobia = { amount: result, level: 0 };
         }
      }
   }

   if (!hasFlag(save.options.migrationFlags, MigrationFlags.DefaultShortcutsMigrated)) {
      save.options.shortcuts = { ...DEFAULT_SHORTCUTS, ...save.options.shortcuts };
      save.options.migrationFlags = setFlag(save.options.migrationFlags, MigrationFlags.DefaultShortcutsMigrated);
   }

   if (!hasFlag(save.options.migrationFlags, MigrationFlags.ShortcutEditorActionsMigrated)) {
      save.options.shortcuts = { ...DEFAULT_SHORTCUTS, ...save.options.shortcuts };
      save.options.migrationFlags = setFlag(save.options.migrationFlags, MigrationFlags.ShortcutEditorActionsMigrated);
   }

   if (!hasFlag(save.options.migrationFlags, MigrationFlags.EmptyTileTierShortcutsMigrated)) {
      save.options.shortcuts = { ...DEFAULT_SHORTCUTS, ...save.options.shortcuts };
      save.options.migrationFlags = setFlag(save.options.migrationFlags, MigrationFlags.EmptyTileTierShortcutsMigrated);
   }

   if (!hasFlag(save.options.migrationFlags, MigrationFlags.EmptyTileWonderShortcutMigrated)) {
      save.options.shortcuts = { ...DEFAULT_SHORTCUTS, ...save.options.shortcuts };
      save.options.migrationFlags = setFlag(save.options.migrationFlags, MigrationFlags.EmptyTileWonderShortcutMigrated);
   }

   if (!hasFlag(save.options.migrationFlags, MigrationFlags.WorldPageShortcutsMigrated)) {
      save.options.shortcuts = { ...DEFAULT_SHORTCUTS, ...save.options.shortcuts };
      save.options.migrationFlags = setFlag(save.options.migrationFlags, MigrationFlags.WorldPageShortcutsMigrated);
   }

   if (!hasFlag(save.options.migrationFlags, MigrationFlags.WorldPageNumpadShortcutsMigrated)) {
      save.options.shortcuts = { ...DEFAULT_SHORTCUTS, ...save.options.shortcuts };
      for (const [action, legacyKey] of Object.entries(LEGACY_WORLD_SHORTCUT_KEYS)) {
         const current = save.options.shortcuts[action as keyof typeof DEFAULT_SHORTCUTS];
         if (
            current?.key === legacyKey &&
            !current.ctrl &&
            !current.alt &&
            !current.shift &&
            !current.meta
         ) {
            save.options.shortcuts[action as keyof typeof DEFAULT_SHORTCUTS] =
               DEFAULT_SHORTCUTS[action as keyof typeof DEFAULT_SHORTCUTS];
         }
      }
      save.options.migrationFlags = setFlag(
         save.options.migrationFlags,
         MigrationFlags.WorldPageNumpadShortcutsMigrated,
      );
   }

   if (isNullOrUndefined(save.options.rankUpFlags)) {
      save.options.rankUpFlags = RankUpFlags.Unset;
   }

   if (isNullOrUndefined(save.options.warehouseQuickMode)) {
      save.options.warehouseQuickMode = false;
   }
}
