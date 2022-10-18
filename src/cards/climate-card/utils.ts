import { HvacAction, HvacMode, PresetMode } from "../../ha";

export const CLIMATE_HVAC_MODE_COLORS: Record<HvacMode, string> = {
    auto: "var(--rgb-state-climate-auto)",
    cool: "var(--rgb-state-climate-cool)",
    dry: "var(--rgb-state-climate-dry)",
    fan_only: "var(--rgb-state-climate-fan-only)",
    heat: "var(--rgb-state-climate-heat)",
    heat_cool: "var(--rgb-state-climate-heat-cool)",
    off: "var(--rgb-state-climate-off)",
};

export const CLIMATE_PRESET_MODE_COLORS: Record<PresetMode, string> = {
    sleep: "var(--rgb-blue)",
    away: "var(--rgb-blue)",
    comfort: "var(--rgb-red)",
    home: "var(--rgb-green)",
};

export const CLIMATE_HVAC_ACTION_COLORS: Record<HvacAction, string> = {
    cooling: "var(--rgb-state-climate-cool)",
    drying: "var(--rgb-state-climate-dry)",
    heating: "var(--rgb-state-climate-heat)",
    idle: "var(--rgb-state-climate-idle)",
    off: "var(--rgb-state-climate-off)",
};

export const CLIMATE_HVAC_MODE_ICONS: Record<HvacMode, string> = {
    auto: "mdi:calendar-sync",
    cool: "mdi:snowflake",
    dry: "mdi:water-percent",
    fan_only: "mdi:fan",
    heat: "mdi:fire",
    heat_cool: "mdi:autorenew",
    off: "mdi:power",
};

export const CLIMATE_HVAC_ACTION_ICONS: Record<HvacAction, string> = {
    cooling: "mdi:snowflake",
    drying: "mdi:water-percent",
    heating: "mdi:fire",
    idle: "mdi:clock-outline",
    off: "mdi:power",
};

export const CLIMATE_PRESET_MODE_ICONS: Record<PresetMode, string> = {
    away: "mdi:home-export-outline",
    home: "mdi:home-outline",
    sleep: "mdi:bed-outline",
    comfort: "mdi:sofa-outline",
};

export function getHvacModeColor(hvacMode: HvacMode): string {
    return CLIMATE_HVAC_MODE_COLORS[hvacMode] ?? CLIMATE_HVAC_MODE_COLORS.off;
}

export function getPresetModeColor(presetMode: PresetMode): string {
    return CLIMATE_PRESET_MODE_COLORS[presetMode] ?? CLIMATE_PRESET_MODE_COLORS.away;
}

export function getHvacActionColor(hvacAction: HvacAction): string {
    return CLIMATE_HVAC_ACTION_COLORS[hvacAction] ?? CLIMATE_HVAC_ACTION_COLORS.off;
}

export function getHvacModeIcon(hvacMode: HvacMode): string {
    return CLIMATE_HVAC_MODE_ICONS[hvacMode] ?? "mdi:thermostat";
}

export function getPresetModeIcon(presetMode: PresetMode): string {
    return CLIMATE_PRESET_MODE_ICONS[presetMode] ?? "mdi:fan";
}

export function getHvacActionIcon(hvacAction: HvacAction): string | undefined {
    return CLIMATE_HVAC_ACTION_ICONS[hvacAction] ?? "";
}
