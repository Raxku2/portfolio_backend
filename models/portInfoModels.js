export class portfolioInfo {
  static format(data) {
    const formatted = {};

    // 1. Conditionally add fields only if they are provided
    if (data.name !== undefined) formatted.name = String(data.name).trim();
    if (data.role !== undefined) formatted.role = String(data.role).trim();
    if (data.dp !== undefined) formatted.dp = String(data.dp).trim();
    if (data.uptime !== undefined) formatted.uptime = String(data.uptime).trim();
    if (data.location !== undefined)
      formatted.location = String(data.location).trim();
    if (data.hobbies !== undefined)
      formatted.hobbies = String(data.hobbies).trim();
    if (data.bio_title !== undefined)
      formatted.bio_title = String(data.bio_title).trim();
    if (data.dp_file_id !== undefined)
      formatted.dp_file_id = String(data.dp_file_id).trim();

    if (data.energy_level !== undefined) {
      formatted.energy_level = String(data.energy_level).trim();
    }

    // 2. Validate that 'bio' is an actual JSON object (not an array or null)
    if (data.bio !== undefined) {
      if (typeof data.bio !== 'object' || Array.isArray(data.bio) || data.bio === null) {
        throw new Error("'bio' must be a JSON object containing key-value pairs.");
      }
      formatted.bio = {
        part_1: String(data.bio.part_1 ?? "").trim(),
        part_2: String(data.bio.part_2 ?? "").trim(),
      };
    }

    if (data.online !== undefined) formatted.online = Boolean(data.online);
    if (data.work_load !== undefined)
      formatted.work_load = String(data.work_load).trim();
    if (data.memory !== undefined)
      formatted.memory = String(data.memory).trim();

    // 3. Ensure at least one valid field was actually formatted
    if (Object.keys(formatted).length === 0) {
      throw new Error("At least one valid field must be provided.");
    }

    return formatted;
  }
}
