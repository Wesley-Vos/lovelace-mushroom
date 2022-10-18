import { html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import {
    ClimateEntity,
    compareClimatePresetModes,
    computeRTL,
    HomeAssistant,
    PresetMode,
    isAvailable,
} from "../../../ha";
import "../../../shared/button";
import "../../../shared/button-group";
import { getPresetModeIcon, getPresetModeColor } from "../utils";

export const isPresetModesVisible = (entity: ClimateEntity, modes?: PresetMode[]) =>
    (entity.attributes.preset_modes || []).some((mode) => (modes ?? []).includes(mode));

@customElement("mushroom-climate-preset-modes-control")
export class ClimatePresetModesControl extends LitElement {
    @property({ attribute: false }) public hass!: HomeAssistant;

    @property({ attribute: false }) public entity!: ClimateEntity;

    @property({ attribute: false }) public modes!: PresetMode[];

    @property() public fill: boolean = false;

    private callService(e: CustomEvent) {
        e.stopPropagation();
        const mode = (e.target! as any).mode as PresetMode;
        this.hass.callService("climate", "set_preset_mode", {
            entity_id: this.entity!.entity_id,
            preset_mode: mode,
        });
    }

    protected render(): TemplateResult {
        const rtl = computeRTL(this.hass);

        const modes = this.entity.attributes.preset_modes
            .filter((mode) => (this.modes ?? []).includes(mode))
            .sort(compareClimatePresetModes);

        return html`
            <mushroom-button-group .fill=${this.fill} ?rtl=${rtl}>
                ${modes.map((mode) => this.renderModeButton(mode))}
            </mushroom-button-group>
        `;
    }

    private renderModeButton(mode: PresetMode) {
        const iconStyle = {};
        const color = getPresetModeColor(mode);
        if (mode === this.entity.attributes.preset_mode) {
            iconStyle["--icon-color"] = `rgb(${color})`;
            iconStyle["--bg-color"] = `rgba(${color}, 0.2)`;
        }

        return html`
            <mushroom-button
                style=${styleMap(iconStyle)}
                .icon=${getPresetModeIcon(mode)}
                .mode=${mode}
                .disabled=${!isAvailable(this.entity)}
                @click=${this.callService}
            ></mushroom-button>
        `;
    }
}
