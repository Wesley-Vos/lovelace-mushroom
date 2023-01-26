import { html, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import memoizeOne from "memoize-one";
import { assert } from "superstruct";
import { atLeastHaVersion, LocalizeFunc, fireEvent, LovelaceCardEditor } from "../../ha";
import setupCustomlocalize from "../../localize";
import { computeActionsFormSchema } from "../../shared/config/actions-config";
import { APPEARANCE_FORM_SCHEMA } from "../../shared/config/appearance-config";
import { MushroomBaseElement } from "../../utils/base-element";
import { GENERIC_LABELS } from "../../utils/form/generic-fields";
import { HaFormSchema } from "../../utils/form/ha-form";
import { UiAction } from "../../utils/form/ha-selector";
import { stateIcon } from "../../utils/icons/state-icon";
import { loadHaComponents } from "../../utils/loader";
import {
    DISPLAY_MODE,
    GRAPH_CARD_EDITOR_NAME,
    GRAPH_DEFAULT_HOURS,
    GRAPH_ENTITY_DOMAINS,
    GRAPH_MODE,
} from "./const";

import { GraphCardConfig, graphCardConfigStruct } from "./graph-card-config";
import { SelectOption } from "../../utils/form/ha-selector";
import { TEMPLATE_LABELS } from "../template-card/template-card-editor";

const actions: UiAction[] = ["more-info", "call-service", "none"];
const GRAPH_LABELS = ["graph_mode", "display_mode"];

// const computeSchema = memoizeOne((localize: LocalizeFunc, icon?: string): HaFormSchema[] => [
//     { name: "entity", selector: { entity: { domain: GRAPH_ENTITY_DOMAINS } } },
//     { name: "name", selector: { text: {} } },
//     { name: "icon", selector: { icon: { placeholder: icon } } },
//     ...APPEARANCE_FORM_SCHEMA,
//     {
//         type: "grid",
//         name: "",
//         schema: [
//             { name: "graph_color", selector: { "mush-color": {} } },
//             {
//                 name: "hours_to_show",
//                 selector: { number: { min: 1, max: 168, mode: "box", step: 1 } },
//             },
//         ],
//     },
//     {
//         type: "grid",
//         name: "",
//         schema: [
//             {
//                 name: "graph_mode",
//                 selector: {
//                     select: {
//                         options: GRAPH_MODE.map(
//                             (mode) =>
//                                 <SelectOption>{
//                                     value: mode,
//                                     label:
//                                         localize(`editor.card.graph.graph_mode_type.${mode}`) ||
//                                         mode,
//                                 }
//                         ) as SelectOption[],
//                         mode: "dropdown",
//                     },
//                 },
//             },
//             {
//                 name: "display_mode",
//                 selector: {
//                     select: {
//                         options: DISPLAY_MODE.map(
//                             (mode) =>
//                                 <SelectOption>{
//                                     value: `${mode}`,
//                                     label:
//                                         localize(`editor.card.graph.display_mode_type.${mode}`) ||
//                                         mode,
//                                 }
//                         ) as SelectOption[],
//                         mode: "dropdown",
//                     },
//                 },
//             },
//         ],
//     },
// ]);

// const computeSchema = memoizeOne((localize: LocalizeFunc, icon?: string): HaFormSchema[] => [
const computeSchema = memoizeOne((localize: LocalizeFunc, version: string): HaFormSchema[] => [
    { name: "entity", selector: { entity: { domain: GRAPH_ENTITY_DOMAINS } } },
    {
        name: "icon",
        selector: atLeastHaVersion(version, 2022, 5)
            ? { template: {} }
            : { text: { multiline: true } },
    },
    {
        name: "icon_color",
        selector: atLeastHaVersion(version, 2022, 5)
            ? { template: {} }
            : { text: { multiline: true } },
    },
    {
        name: "primary",
        selector: atLeastHaVersion(version, 2022, 5)
            ? { template: {} }
            : { text: { multiline: true } },
    },
    {
        name: "secondary",
        selector: atLeastHaVersion(version, 2022, 5)
            ? { template: {} }
            : { text: { multiline: true } },
    },
    {
        name: "badge_icon",
        selector: atLeastHaVersion(version, 2022, 5)
            ? { template: {} }
            : { text: { multiline: true } },
    },
    {
        name: "badge_color",
        selector: atLeastHaVersion(version, 2022, 5)
            ? { template: {} }
            : { text: { multiline: true } },
    },
    {
        name: "picture",
        selector: atLeastHaVersion(version, 2022, 5)
            ? { template: {} }
            : { text: { multiline: true } },
    },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "layout", selector: { "mush-layout": {} } },
            { name: "fill_container", selector: { boolean: {} } },
            { name: "multiline_secondary", selector: { boolean: {} } },
        ],
    },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "graph_color", selector: { "mush-color": {} } },
            {
                name: "hours_to_show",
                selector: { number: { min: 1, max: 168, mode: "box", step: 1 } },
            },
        ],
    },
    {
        type: "grid",
        name: "",
        schema: [
            {
                name: "graph_mode",
                selector: {
                    select: {
                        options: GRAPH_MODE.map(
                            (mode) =>
                                <SelectOption>{
                                    value: mode,
                                    label:
                                        localize(`editor.card.graph.graph_mode_type.${mode}`) ||
                                        mode,
                                }
                        ) as SelectOption[],
                        mode: "dropdown",
                    },
                },
            },
            {
                name: "display_mode",
                selector: {
                    select: {
                        options: DISPLAY_MODE.map(
                            (mode) =>
                                <SelectOption>{
                                    value: `${mode}`,
                                    label:
                                        localize(`editor.card.graph.display_mode_type.${mode}`) ||
                                        mode,
                                }
                        ) as SelectOption[],
                        mode: "dropdown",
                    },
                },
            },
        ],
    },
    {
        name: "points_per_hour",
        selector: { number: { min: 1, max: 168, mode: "box", step: 1 } },
    },
    ...computeActionsFormSchema(),
]);
@customElement(GRAPH_CARD_EDITOR_NAME)
export class GraphCardEditor extends MushroomBaseElement implements LovelaceCardEditor {
    @state() private _config?: GraphCardConfig;

    connectedCallback() {
        super.connectedCallback();
        void loadHaComponents();
    }

    public setConfig(config: GraphCardConfig): void {
        assert(config, graphCardConfigStruct);
        this._config = config;
    }

    private _computeLabelCallback = (schema: HaFormSchema) => {
        const customLocalize = setupCustomlocalize(this.hass!);

        if (GENERIC_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.generic.${schema.name}`);
        }

        if (GRAPH_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.graph.${schema.name}`);
        }
        return this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    };

    // protected render(): TemplateResult {
    //     if (!this.hass || !this._config) {
    //         return html``;
    //     }

    //     const entityState = this._config.entity ? this.hass.states[this._config.entity] : undefined;
    //     const entityIcon = entityState ? stateIcon(entityState) : undefined;
    //     const icon = this._config.icon || entityIcon;

    //     const customLocalize = setupCustomlocalize(this.hass!);
    //     const schema = computeSchema(customLocalize, icon);

    //     this._config = {
    //         hours_to_show: GRAPH_DEFAULT_HOURS,
    //         ...this._config,
    //     };

    //     return html`
    //         <ha-form
    //             .hass=${this.hass}
    //             .data=${this._config}
    //             .schema=${schema}
    //             .computeLabel=${this._computeLabelCallback}
    //             @value-changed=${this._valueChanged}
    //         ></ha-form>
    //     `;
    // }

    private _computeLabel = (schema: HaFormSchema) => {
        const customLocalize = setupCustomlocalize(this.hass!);

        if (schema.name === "entity") {
            return `${this.hass!.localize(
                "ui.panel.lovelace.editor.card.generic.entity"
            )} (${customLocalize("editor.card.template.entity_extra")})`;
        }
        if (GENERIC_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.generic.${schema.name}`);
        }
        if (TEMPLATE_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.template.${schema.name}`);
        }
        return this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    };


    protected render(): TemplateResult {
        if (!this.hass || !this._config) {
            return html``;
        }
        
        const customLocalize = setupCustomlocalize(this.hass!);

        return html`
            <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${computeSchema(customLocalize, this.hass!.connection.haVersion)}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._valueChanged}
            ></ha-form>
        `;
    }

    private _valueChanged(ev: CustomEvent): void {
        fireEvent(this, "config-changed", { config: ev.detail.value });
    }
}
