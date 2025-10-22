/**
 * Resource model interface
 */
export interface Resource {
  id?: number;
  name: string;
  description?: string;
  category?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Resource filter interface for querying
 */
export interface ResourceFilter {
  category?: string;
  status?: string;
  name?: string;
}

/**
 * Create resource input (without auto-generated fields)
 */
export interface CreateResourceInput {
  name: string;
  description?: string;
  category?: string;
  status?: string;
}

/**
 * Update resource input (all fields optional except id)
 */
export interface UpdateResourceInput {
  name?: string;
  description?: string;
  category?: string;
  status?: string;
}
