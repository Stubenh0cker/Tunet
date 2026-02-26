/**
 * Climate / thermostat helpers.
 *
 * Many Z2M thermostats (e.g. Bosch BTH-RM230Z) expose the heating setpoint
 * under different HA attribute names depending on the current HVAC mode:
 *
 *   • "heat" mode  → `temperature`
 *   • "auto" mode   → `target_temp_low` / `target_temp_high`
 *   • Z2M direct    → `occupied_heating_setpoint`
 *
 * The helpers below abstract over these differences so every card and modal
 * can display and control the setpoint correctly.
 */

/**
 * Resolve the effective target (setpoint) temperature from a climate entity.
 *
 * @param {object} entity – HA climate entity (with `.attributes`)
 * @returns {number|null} – numeric setpoint, or null when unavailable
 */
export function getTargetTemperature(entity) {
  const a = entity?.attributes;
  if (!a) return null;

  // Standard single-setpoint (heat / cool mode)
  if (typeof a.temperature === 'number') return a.temperature;

  // Range mode (auto / heat_cool) – prefer the low (heating) target
  if (typeof a.target_temp_low === 'number') return a.target_temp_low;

  // Z2M may expose this directly
  if (typeof a.occupied_heating_setpoint === 'number') return a.occupied_heating_setpoint;

  return null;
}

/**
 * Build the `service_data` payload for `climate.set_temperature`.
 *
 * Automatically picks the right parameter name depending on whether the
 * entity is currently in range mode or single-setpoint mode.
 *
 * @param {object}  entity   – HA climate entity
 * @param {string}  entityId – entity_id string
 * @param {number}  newTemp  – desired target temperature
 * @returns {object} – ready-to-use service_data for callService()
 */
export function buildSetTemperatureData(entity, entityId, newTemp) {
  const a = entity?.attributes;

  // Range mode: entity exposes target_temp_low / target_temp_high
  if (a && typeof a.target_temp_low === 'number' && typeof a.target_temp_high === 'number') {
    return {
      entity_id: entityId,
      target_temp_low: newTemp,
      target_temp_high: a.target_temp_high,
    };
  }

  // Default: single-setpoint mode
  return {
    entity_id: entityId,
    temperature: newTemp,
  };
}
