/**
 * Generic, reusable table. Every column except "Sr No." and "Actions" is
 * caller-supplied - nothing about a specific entity (users, products, ...)
 * is hardcoded here.
 *
 * @param {Array<{key: string, header: string, render?: (row) => ReactNode}>} columns
 *   `render` is optional - defaults to `row[key]`. Use it for formatting,
 *   badges, fallback text for empty values, etc.
 * @param {Array<object>} data - rows to render.
 * @param {string} [rowKey='_id'] - field used as the React key per row.
 * @param {Array<{key,label,onClick,variant?}> | (row) => Array<{key,label,onClick,variant?}>} [actions=[]]
 *   Rendered as buttons in the Actions cell. Either a static array applied
 *   to every row, or a function of the row for per-row visibility (e.g. an
 *   action that only makes sense for a given status) - the table doesn't
 *   care which, it just resolves it per row.
 * @param {string} [emptyMessage='No records found']
 */
export default function DataTable({
  columns,
  data,
  rowKey = '_id',
  actions = [],
  emptyMessage = 'No records found',
}) {
  const columnCount = columns.length + 2; // + Sr No. + Actions

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background text-text-muted">
            <th className="px-4 py-3 font-medium">Sr No.</th>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.header}
              </th>
            ))}
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-4 py-6 text-center text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const rowActions = typeof actions === 'function' ? actions(row) : actions;

              return (
                <tr key={row[rowKey] ?? index} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-muted">{index + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-text">
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    {rowActions.length === 0 ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <div className="flex gap-2">
                        {rowActions.map((action) => (
                          <button
                            key={action.key}
                            type="button"
                            onClick={() => action.onClick(row)}
                            className={`rounded-field px-2 py-1 hover:bg-primary/10 ${
                              action.variant === 'danger' ? 'text-danger' : 'text-primary'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
