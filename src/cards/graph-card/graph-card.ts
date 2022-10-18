import {
    actionHandler,
    ActionHandlerEvent,
    computeRTL,
    handleAction,
    hasAction,
    HomeAssistant,
    LovelaceCard,
    LovelaceCardEditor,
    RenderTemplateResult,
    subscribeRenderTemplate
} from "../../ha";
import { computeAppearance } from "../../utils/appearance";
import { HassEntity, UnsubscribeFunc} from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { fetchRecent } from "../../ha/data/history";
import { coordinates } from "../../shared/graph/coordinates";
import "../../shared/graph/graph-base";
import { cardStyle } from "../../utils/card-styles";
import { computeRgbColor } from "../../utils/colors";
import { registerCustomCard } from "../../utils/custom-cards";
import { MushroomBaseElement } from "../../utils/base-element";
import {
    GRAPH_CARD_EDITOR_NAME,
    GRAPH_CARD_NAME,
    GRAPH_DEFAULT_HOURS,
    GRAPH_ENTITY_DOMAINS,
    GRAPH_HEIGHT_COMPACT,
    GRAPH_HEIGHT_COMPACT_MARGIN,
    GRAPH_HEIGHT_STANDARD,
    GRAPH_HEIGHT_STANDARD_MARGIN,
    GRAPH_HOUR,
    GRAPH_MINUTE,
} from "./const";
import { GraphCardConfig } from "./graph-card-config";

registerCustomCard({
    type: GRAPH_CARD_NAME,
    name: "Mushroom Graph Card",
    description: "Graph Card for sensor entity",
});

const TEMPLATE_KEYS = [
    "icon",
    "icon_color",
    "badge_color",
    "badge_icon",
    "primary",
    "secondary",
    "picture",
] as const;
type TemplateKey = typeof TEMPLATE_KEYS[number];

@customElement(GRAPH_CARD_NAME)
export class GraphCard extends MushroomBaseElement implements LovelaceCard {
    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        await import("./graph-card-editor");
        return document.createElement(GRAPH_CARD_EDITOR_NAME) as LovelaceCardEditor;
    }

    public static async getStubConfig(hass: HomeAssistant): Promise<GraphCardConfig> {
        const entities = Object.keys(hass.states);
        const entity = entities.filter((e) => GRAPH_ENTITY_DOMAINS.includes(e.split(".")[0]));
        return {
            type: `custom:${GRAPH_CARD_NAME}`,
            entity: entity[0],
            points_per_hour: 2
        };
    }

    @state() private _config?: GraphCardConfig;

    @state() private _templateResults: Partial<
        Record<TemplateKey, RenderTemplateResult | undefined>
    > = {};

    @state() private _unsubRenderTemplates: Map<TemplateKey, Promise<UnsubscribeFunc>> = new Map();


    @state() private _coordinates?: number[][];

    private _stateHistory?: HassEntity[];

    private _date?: Date;

    private _fetching = false;

    getCardSize(): number | Promise<number> {
        return 1;
    }

    setConfig(config: GraphCardConfig): void {
        TEMPLATE_KEYS.forEach((key) => {
            if (this._config?.[key] !== config[key] || this._config?.entity != config.entity) {
                this._tryDisconnectKey(key);
            }
        });
        this._config = {
            hours_to_show: GRAPH_DEFAULT_HOURS,
            graph_mode: "fill",
            display_mode: "standard",
            tap_action: {
                action: "toggle",
            },
            hold_action: {
                action: "more-info",
            },
            ...config,
        };
    }


    public connectedCallback() {
        super.connectedCallback();
        this._tryConnect();
    }

    public disconnectedCallback() {
        this._tryDisconnect();
    }

    protected updated(changedProps: PropertyValues): void {
        super.updated(changedProps);
        // if (!this._config || !this.hass) {
        //     return;
        // }

        if (!this._config || !this.hass || (this._fetching && !changedProps.has("_config"))) {
            return;
        }

        if (changedProps.has("_config")) {
            const oldConfig = changedProps.get("_config") as GraphCardConfig;
            if (!oldConfig || oldConfig.entity !== this._config!.entity) {
                this._stateHistory = [];
            }

            this._getCoordinates();
        } else if (Date.now() - this._date!.getTime() >= GRAPH_MINUTE) {
            this._getCoordinates();
        }

        this._tryConnect();
    }

    // protected updated(changedProperties: PropertyValues) {
    //     if (!this._config || !this.hass || (this._fetching && !changedProperties.has("_config"))) {
    //         return;
    //     }

    //     if (changedProperties.has("_config")) {
    //         const oldConfig = changedProperties.get("_config") as GraphCardConfig;
    //         if (!oldConfig || oldConfig.entity !== this._config!.entity) {
    //             this._stateHistory = [];
    //         }

    //         this._getCoordinates();
    //     } else if (Date.now() - this._date!.getTime() >= GRAPH_MINUTE) {
    //         this._getCoordinates();
    //     }
    // }

    private _handleAction(ev: ActionHandlerEvent) {
        handleAction(this, this.hass!, this._config!, ev.detail.action!);
    }

    public isTemplate(key: TemplateKey) {
        const value = this._config?.[key];
        return value?.includes("{");
    }

    private getValue(key: TemplateKey) {
        return this.isTemplate(key) ? this._templateResults[key]?.result : this._config?.[key];
    }

    private async _getCoordinates(): Promise<void> {
        this._fetching = true;
        const endTime = new Date();
        const startTime =
            !this._date || !this._stateHistory?.length
                ? new Date(new Date().setHours(endTime.getHours() - this._config!.hours_to_show!))
                : this._date;

        if (this._stateHistory!.length) {
            const inHoursToShow: HassEntity[] = [];
            const outHoursToShow: HassEntity[] = [];
            // Split into inside and outside of "hours to show".
            this._stateHistory!.forEach((entity) =>
                (endTime.getTime() - new Date(entity.last_changed).getTime() <=
                this._config!.hours_to_show! * GRAPH_HOUR
                    ? inHoursToShow
                    : outHoursToShow
                ).push(entity)
            );

            if (outHoursToShow.length) {
                // If we have values that are now outside of "hours to show", re-add the last entry. This could e.g. be
                // the "initial state" from the history backend. Without it, it would look like there is no history data
                // at the start at all in the database = graph would start suddenly instead of on the left side of the card.
                inHoursToShow.push(outHoursToShow[outHoursToShow.length - 1]);
            }
            this._stateHistory = inHoursToShow;
        }

        const stateHistory = await fetchRecent(
            this.hass!,
            this._config!.entity!,
            startTime,
            endTime,
            Boolean(this._stateHistory!.length)
        );

        if (stateHistory.length && stateHistory[0].length) {
            this._stateHistory!.push(...stateHistory[0]);
        }

        this._coordinates =
            coordinates(
                this._stateHistory,
                this._config!.hours_to_show!,
                500,
                this._config!.display_mode === "standard"
                    ? GRAPH_HEIGHT_STANDARD
                    : GRAPH_HEIGHT_COMPACT,
                this._config!.points_per_hour!
            ) || [];

        this._date = endTime;
        this._fetching = false;
    }

    protected render(): TemplateResult {
        if (!this._config || !this.hass || !this._config.entity) {
            return html``;
        }

        const entity_id = this._config.entity;
        const entity = this.hass.states[entity_id];

        // const name = this._config.name || entity.attributes.friendly_name || "";
        //const icon = this._config.icon || stateIcon(entity);
        //const appearance = computeAppearance(this._config);
        //const picture = computeEntityPicture(entity, appearance.icon_type);

        
        const graphMode = this._config.graph_mode;
        
        let graphHeight: number = GRAPH_HEIGHT_STANDARD + GRAPH_HEIGHT_STANDARD_MARGIN;

        if (this._config.display_mode !== "standard") {
            graphHeight = GRAPH_HEIGHT_COMPACT + GRAPH_HEIGHT_COMPACT_MARGIN;
        }

        const icon = this.getValue("icon");
        const iconColor = this.getValue("icon_color");
        const badgeIcon = this.getValue("badge_icon");
        const badgeColor = this.getValue("badge_color");
        const primary = this.getValue("primary");
        const secondary = this.getValue("secondary");
        const picture = this.getValue("picture");

        // // graphColor = iconColor;
        // graphColor = graphColor ?? iconColor;
        // console.log(graphColor)
        const graphColor = this._config.graph_color ?? iconColor;

        const multiline_secondary = this._config.multiline_secondary;

        const appearance = computeAppearance({
            fill_container: this._config.fill_container,
            layout: this._config.layout,
            icon_type: Boolean(picture) ? "entity-picture" : Boolean(icon) ? "icon" : "none",
            primary_info: Boolean(primary) ? "name" : "none",
            secondary_info: Boolean(secondary) ? "state" : "none",
        });

        const rtl = computeRTL(this.hass);

        return html`
            <ha-card class=${classMap({ "fill-container": appearance.fill_container ?? false })} style='padding: 0; overflow:hidden'>
                <mushroom-card .appearance=${appearance} ?rtl=${rtl} style='padding: var(--spacing)'>
                    <mushroom-state-item
                        ?rtl=${rtl}
                        .appearance=${appearance}
                        @action=${this._handleAction}
                        .actionHandler=${actionHandler({
                            hasHold: hasAction(this._config.hold_action),
                            hasDoubleClick: hasAction(this._config.double_tap_action),
                        })}
                    >
                    ${picture
                        ? this.renderPicture(picture)
                        : icon
                        ? this.renderIcon(icon, iconColor)
                        : null}
                    ${(icon || picture) && badgeIcon
                        ? this.renderBadgeIcon(badgeIcon, badgeColor)
                        : undefined}
                    <mushroom-state-info
                        slot="info"
                        .primary=${primary}
                        .secondary=${secondary}
                        .multiline_secondary=${multiline_secondary}
                    ></mushroom-state-info>
                    </mushroom-state-item>
                </mushroom-card>
                <mushroom-graph-base
                    .coordinates=${this._coordinates}
                    .graphColor=${graphColor}
                    .graphMode=${graphMode}
                    .graphHeight=${graphHeight}
                >
                </mushroom-graph-base>
            </ha-card>
        `;
    }

    renderPicture(picture: string): TemplateResult {
        return html`
            <mushroom-shape-avatar
                slot="icon"
                .picture_url=${(this.hass as any).hassUrl(picture)}
            ></mushroom-shape-avatar>
        `;
    }

    renderIcon(icon: string, iconColor?: string) {
        const iconStyle = {};
        if (iconColor) {
            const iconRgbColor = computeRgbColor(iconColor);
            iconStyle["--icon-color"] = `rgb(${iconRgbColor})`;
            iconStyle["--shape-color"] = `rgba(${iconRgbColor}, 0.2)`;
        }
        return html`
            <mushroom-shape-icon
                style=${styleMap(iconStyle)}
                slot="icon"
                .icon=${icon}
            ></mushroom-shape-icon>
        `;
    }

    renderBadgeIcon(badge: string, badgeColor?: string) {
        const badgeStyle = {};
        if (badgeColor) {
            const iconRgbColor = computeRgbColor(badgeColor);
            badgeStyle["--main-color"] = `rgba(${iconRgbColor})`;
        }
        return html`
            <mushroom-badge-icon
                slot="badge"
                .icon=${badge}
                style=${styleMap(badgeStyle)}
            ></mushroom-badge-icon>
        `;
    }

    private async _tryConnect(): Promise<void> {
        TEMPLATE_KEYS.forEach((key) => {
            this._tryConnectKey(key);
        });
    }

    private async _tryConnectKey(key: TemplateKey): Promise<void> {
        if (
            this._unsubRenderTemplates.get(key) !== undefined ||
            !this.hass ||
            !this._config ||
            !this.isTemplate(key)
        ) {
            return;
        }

        try {
            const sub = subscribeRenderTemplate(
                this.hass.connection,
                (result) => {
                    this._templateResults = {
                        ...this._templateResults,
                        [key]: result,
                    };
                },
                {
                    template: this._config[key] ?? "",
                    entity_ids: this._config.entity_id,
                    variables: {
                        config: this._config,
                        user: this.hass.user!.name,
                        entity: this._config.entity,
                    },
                    strict: true,
                }
            );
            this._unsubRenderTemplates.set(key, sub);
            await sub;
        } catch (_err) {
            const result = {
                result: this._config[key] ?? "",
                listeners: {
                    all: false,
                    domains: [],
                    entities: [],
                    time: false,
                },
            };
            this._templateResults = {
                ...this._templateResults,
                [key]: result,
            };
            this._unsubRenderTemplates.delete(key);
        }
    }

    private async _tryDisconnect(): Promise<void> {
        TEMPLATE_KEYS.forEach((key) => {
            this._tryDisconnectKey(key);
        });
    }

    private async _tryDisconnectKey(key: TemplateKey): Promise<void> {
        const unsubRenderTemplate = this._unsubRenderTemplates.get(key);
        if (!unsubRenderTemplate) {
            return;
        }

        try {
            const unsub = await unsubRenderTemplate;
            unsub();
            this._unsubRenderTemplates.delete(key);
        } catch (err: any) {
            if (err.code === "not_found" || err.code === "template_error") {
                // If we get here, the connection was probably already closed. Ignore.
            } else {
                throw err;
            }
        }
    }

    static get styles(): CSSResultGroup {
        return [super.styles, cardStyle];
    }

    // protected renderBadge(entity: HassEntity) {
    //     const unavailable = !isAvailable(entity);
    //     if (unavailable) {
    //         return super.renderBadge(entity);
    //     } else {
    //         return super.renderBadge(entity);
    //     }
    // }
}


// <mushroom-shape-icon
                        //     slot="icon"
                        //     style=${styleMap(iconStyle)}
                        //     .disabled=${!active}
                        //     .icon=${icon}
                        // ></mushroom-shape-icon>
                        // ${!isAvailable(entity)
                        //     ? html`
                        //           <mushroom-badge-icon
                        //               class="unavailable"
                        //               slot="badge"
                        //               icon="mdi:help"
                        //           ></mushroom-badge-icon>
                        //       `
                        //     : null}

                        // <mushroom-state-info
                        //     slot="info"
                        //     .primary=${primary}
                        //     .secondary=${secondary}
                        // ></mushroom-state-info>