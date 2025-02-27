import { array, assign, boolean, object, optional, string } from "superstruct";
import { HvacMode, PresetMode, LovelaceCardConfig } from "../../ha";
import { ActionsSharedConfig, actionsSharedConfigStruct } from "../../shared/config/actions-config";
import {
    AppearanceSharedConfig,
    appearanceSharedConfigStruct,
} from "../../shared/config/appearance-config";
import { EntitySharedConfig, entitySharedConfigStruct } from "../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../shared/config/lovelace-card-config";

export const HVAC_MODES: HvacMode[] = [
    "auto",
    "heat_cool",
    "heat",
    "cool",
    "dry",
    "fan_only",
    "off",
];

export const PRESET_MODES: PresetMode[] = [
    "home",
    "away",
    "sleep",
    "comfort",
]

export type ClimateCardConfig = LovelaceCardConfig &
    EntitySharedConfig &
    AppearanceSharedConfig &
    ActionsSharedConfig & {
        show_temperature_control?: false;
        hvac_modes?: HvacMode[];
        preset_modes?: PresetMode[];
        collapsible_controls?: boolean;
    };

export const climateCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    assign(entitySharedConfigStruct, appearanceSharedConfigStruct, actionsSharedConfigStruct),
    object({
        show_temperature_control: optional(boolean()),
        hvac_modes: optional(array(string())),
        preset_modes: optional(array(string())),
        collapsible_controls: optional(boolean()),
    })
);
