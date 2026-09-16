export class portfolioInfo {
  static format(data) {
    const formatted = {};

    // 1. Conditionally add fields only if they are provided
    if (data.name !== undefined) formatted.name = String(data.name).trim();
    if (data.role !== undefined) formatted.role = String(data.role).trim();
    if (data.dp !== undefined) formatted.dp = String(data.dp).trim();
    if (data.uptime !== undefined) formatted.uptime = String(data.uptime).trim();
    
    if (data.energy_level !== undefined) {
      formatted.energy_level = String(data.energy_level).trim().toUpperCase();
    }

    // 2. Validate that 'bio' is an actual JSON object (not an array or null)
    if (data.bio !== undefined) {
      if (typeof data.bio !== 'object' || Array.isArray(data.bio) || data.bio === null) {
        throw new Error("'bio' must be a JSON object containing key-value pairs.");
      }
      formatted.bio = data.bio;
    }

    // 3. Ensure at least one valid field was actually formatted
    if (Object.keys(formatted).length === 0) {
      throw new Error("At least one valid field must be provided.");
    }

    return formatted;
  }
}
