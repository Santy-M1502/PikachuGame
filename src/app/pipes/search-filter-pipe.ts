import { Pipe, PipeTransform } from '@angular/core';

function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function normalizeString(str: any) {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

@Pipe({
  name: 'searchFilter',
  standalone: true
})
export class SearchFilterPipe implements PipeTransform {
  transform(value: any[] | null | undefined, term: string | null | undefined, fields?: string | string[]): any[] {
    if (!value || !Array.isArray(value)) return [];
    const q = normalizeString(term);
    if (!q) return value;

    const fieldList = typeof fields === 'string' ? fields.split(',').map(f => f.trim()) :
                      Array.isArray(fields) ? fields : null;

    return value.filter(item => {
      if (fieldList) {
        for (const f of fieldList) {
          const v = getByPath(item, f);
          if (normalizeString(v).includes(q)) return true;
        }
        return false;
      }

      for (const k of Object.keys(item)) {
        const v = item[k];
        if (v == null) continue;
        if (typeof v === 'object') {
          for (const sub of Object.keys(v)) {
            if (normalizeString(v[sub]).includes(q)) return true;
          }
        } else {
          if (normalizeString(v).includes(q)) return true;
        }
      }
      return false;
    });
  }
}
