import type { ComponentType } from "react";
import {
  ArcheryModel,
  BarracksModel,
  FarmModel,
  GoldMineModel,
  LumberMillModel,
  QuarryModel,
  StorehouseModel,
  TownHallModel,
  WallModel,
  WatchTowerModel,
  WizardTowerModel,
} from "./buildingModels";

export const BUILDING_MODEL_REGISTRY: Record<string, ComponentType<{ level: number }>> = {
  townhall: TownHallModel,
  goldmine: GoldMineModel,
  lumbermill: LumberMillModel,
  farm: FarmModel,
  quarry: QuarryModel,
  storehouse: StorehouseModel,
  barracks: BarracksModel,
  archery: ArcheryModel,
  wizardtower: WizardTowerModel,
  watchtower: WatchTowerModel,
  wall: WallModel,
};
