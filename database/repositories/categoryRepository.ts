import type { Category, CategoryScope } from '@/types/category';
import { getDatabase } from '../database';

interface CategoryRow {
  id: number;
  scope: CategoryScope;
  name: string;
  color_hex: string;
  icon_key: string | null;
  is_system: number;
  sort_order: number;
}

function mapRow(row: CategoryRow): Category {
  return {
    id: row.id,
    scope: row.scope,
    name: row.name,
    colorHex: row.color_hex,
    iconKey: row.icon_key,
    isSystem: row.is_system === 1,
    sortOrder: row.sort_order,
  };
}

export async function listCategoriesByScope(scope: CategoryScope): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories WHERE scope = ? ORDER BY sort_order ASC',
    [scope],
  );
  return rows.map(mapRow);
}
