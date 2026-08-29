function nonempty(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value)
}

function fieldsFromTree(nodes, acc = []) {
  for (const node of nodes || []) {
    for (const item of node.items || []) {
      if (item.kind === 'button' || item.kind === 'link' || item.kind === 'heading') continue
      const key = item.bind?.field || item.id
      if (!key) continue
      acc.push({
        key,
        label: item.label,
        type: item.kind,
        widget: item.widget,
        required: item.validation?.required,
        validation: item.validation,
        messages: item.messages,
        hidden: item.hidden === true || item.bind?.hidden === true,
        visual: item.visual,
        interaction: item.interaction,
        apiRefs: item.apiRefs,
        testId: item.testId
      })
    }
    fieldsFromTree(node.sections, acc)
  }
  return acc
}

/**
 * Inventory for FE templates from ir/design.yaml (merged).
 */
export function resolveUiInventory(spec = {}) {
  const ui = spec.ui ?? {}
  const columns = nonempty(ui.columns) ? ui.columns : (ui.list?.columns ?? [])
  const filters = nonempty(ui.filters) ? ui.filters : (ui.list?.filters ?? [])
  let formFields = nonempty(ui.form?.fields) ? ui.form.fields : []
  if (!formFields.length) {
    const tree = nonempty(spec.sections) ? spec.sections : spec.zones
    formFields = fieldsFromTree(tree)
  }

  const tags = [...(spec.tags ?? [])]
  if (spec.shell?.tag && !tags.some((t) => String(t).startsWith('#shell:'))) {
    tags.push(spec.shell.tag)
  }
  for (const pattern of spec.patterns ?? []) {
    const text = typeof pattern === 'string' ? pattern : pattern?.tag
    if (text && !tags.includes(text)) tags.push(text)
  }

  return {
    columns,
    filters,
    formFields,
    tags,
    nav: spec.nav ?? {},
    sections: spec.sections ?? spec.zones ?? [],
    actions: spec.actions ?? []
  }
}
