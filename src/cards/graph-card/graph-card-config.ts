import { array, assign, boolean, enums, object, integer, optional, string } from "superstruct";
import { LovelaceCardConfig } from "../../ha";
import { ActionsSharedConfig, actionsSharedConfigStruct } from "../../shared/config/actions-config";
import {
    AppearanceSharedConfig,
    appearanceSharedConfigStruct,
} from "../../shared/config/appearance-config";
import { EntitySharedConfig, entitySharedConfigStruct } from "../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../shared/config/lovelace-card-config";


import { Info, INFOS } from "../../utils/info";
import { TemplateCardConfig, templateCardConfigStruct } from "../template-card/template-card-config";
import { DISPLAY_MODE, GRAPH_MODE } from "./const";

export type GraphMode = typeof GRAPH_MODE[number];
export type DisplayMode = typeof DISPLAY_MODE[number];

// export interface GraphCardConfig extends LovelaceCardConfig {
//     entity?: string;
//     name?: string;
//     icon?: string;
//     hours_to_show?: number;
//     graph_color?: string;
//     primary_info?: Info;
//     secondary_info?: Info;
//     graph_mode?: GraphMode;
//     display_mode?: DisplayMode;
//     tap_action?: ActionConfig;
//     hold_action?: ActionConfig;
//     double_tap_action?: ActionConfig;
// }

export type GraphCardConfig = TemplateCardConfig & {
        hours_to_show?: number;
        graph_color?: string,
        graph_mode?: GraphMode;
        display_mode?: DisplayMode;
        points_per_hour?: number;
    };

export const graphCardConfigStruct = assign(
    templateCardConfigStruct,
    //assign(entitySharedConfigStruct, appearanceSharedConfigStruct, actionsSharedConfigStruct),
    object({
        hours_to_show: optional(integer()),
        graph_color: optional(string()),
        graph_mode: optional(enums(GRAPH_MODE)),
        display_mode: optional(enums(DISPLAY_MODE)),
        points_per_hour: optional(integer()),
    })
);

// export const graphCardConfigStruct = assign(
//     baseLovelaceCardConfig,
//     object({
//         entity: optional(string()),
//         icon: optional(string()),
//         name: optional(string()),
//         hours_to_show: optional(integer()),
//         graph_color: optional(string()),
//         primary_info: optional(enums(INFOS)),
//         secondary_info: optional(enums(INFOS)),
//         graph_mode: optional(enums(GRAPH_MODE)),
//         display_mode: optional(enums(DISPLAY_MODE)),
//         tap_action: optional(actionConfigStruct),
//         hold_action: optional(actionConfigStruct),
//         double_tap_action: optional(actionConfigStruct),
//     })
// );
