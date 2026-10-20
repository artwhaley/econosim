const DIRECTORY_PAGE_SIZE = 20;
const RELATED_PAGE_SIZE = 20;

const kinds = {
    station: { plural: 'stations', label: 'Station' },
    actor: { plural: 'actors', label: 'Actor' },
    commodity: { plural: 'commodities', label: 'Commodity' },
    inventory: { plural: 'inventories', label: 'Inventory' },
};

const pluralToKind = {};
for (const [kind, meta] of Object.entries(kinds)) {
    pluralToKind[meta.plural] = kind;
}

const elements = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    content: document.getElementById('content'),
    viewKind: document.getElementById('view-kind'),
    viewTitle: document.getElementById('view-title'),
    viewId: document.getElementById('view-id'),
    viewMetric: document.getElementById('view-metric'),
    viewMetricValue: document.getElementById('view-metric-value'),
    viewMetricLabel: document.getElementById('view-metric-label'),
    viewBody: document.getElementById('view-body'),
    homeButton: document.getElementById('home-button'),
    refreshButton: document.getElementById('refresh-button'),
};

const directoryViews = {
    stations: {
        list: document.getElementById('station-list'),
        empty: document.getElementById('station-empty'),
        pager: document.getElementById('station-pager'),
    },
    actors: {
        list: document.getElementById('actor-list'),
        empty: document.getElementById('actor-empty'),
        pager: document.getElementById('actor-pager'),
    },
    commodities: {
        list: document.getElementById('commodity-list'),
        empty: document.getElementById('commodity-empty'),
        pager: document.getElementById('commodity-pager'),
    },
    inventories: {
        list: document.getElementById('inventory-list'),
        empty: document.getElementById('inventory-empty'),
        pager: document.getElementById('inventory-pager'),
    },
};

const state = {
    pages: {},
    selection: null,
};

function el(tag, className = '', text = '') {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (text) {
        element.textContent = text;
    }
    return element;
}

async function getJson(path) {
    const response = await fetch(path, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const body = await response.json();
            if (body && body.error) {
                message = body.error;
            }
        } catch {
            // Non-JSON error body; keep the status message.
        }
        throw new Error(message);
    }
    return response.json();
}

function showError(error) {
    if (!error) {
        elements.error.hidden = true;
        elements.error.textContent = '';
        return;
    }
    elements.error.hidden = false;
    elements.error.textContent = error instanceof Error ? error.message : String(error);
}

function summarize(contents) {
    if (contents.length === 0) {
        return 'Empty';
    }
    return contents.map((line) => `${line.commodityName} × ${line.quantity}`).join(', ');
}

function parseRoute() {
    const raw = location.hash.replace(/^#\/?/, '');
    const separator = raw.indexOf('/');
    if (separator <= 0) {
        return null;
    }

    const kind = pluralToKind[raw.slice(0, separator)];
    const id = decodeURIComponent(raw.slice(separator + 1));
    if (!kind || !id) {
        return null;
    }

    return { kind, id };
}

function navigate(kind, id) {
    if (!kinds[kind]) {
        showError(new Error(`Unknown entity kind '${kind}'.`));
        return;
    }

    const target = `#/${kinds[kind].plural}/${encodeURIComponent(id)}`;
    if (location.hash === target) {
        renderRoute();
        return;
    }

    location.hash = target;
}

function linkButton(kind, id, label) {
    const button = el('button', 'text-button', label);
    button.type = 'button';
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        navigate(kind, id);
    });
    return button;
}

function entityCell(kind, entity) {
    const cell = document.createElement('td');
    const button = el('button', 'text-button entity-name', entity.name);
    button.type = 'button';
    button.title = `Inspect ${entity.name}`;
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        navigate(kind, entity.id);
    });
    cell.append(button, el('span', 'entity-id', entity.id));
    return cell;
}

function refLink(reference) {
    if (!kinds[reference.kind]) {
        const text = el('span', 'ref-link');
        text.append(
            el('span', 'ref-name', reference.name || reference.id),
            el('span', 'ref-id', `${reference.kind} / ${reference.id}`),
        );
        return text;
    }

    const button = el('button', 'ref-link');
    button.type = 'button';
    button.title = `Inspect ${reference.kind} ${reference.id}`;
    button.append(
        el('span', 'ref-name', reference.name || reference.id),
        el('span', 'ref-id', `${reference.kind} / ${reference.id}`),
    );
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        navigate(reference.kind, reference.id);
    });
    return button;
}

function refCell(reference) {
    const cell = el('td', 'ref');
    cell.append(refLink(reference));
    return cell;
}

function buildTable(headers, rows, emptyText) {
    if (rows.length === 0) {
        return el('p', 'empty-state', emptyText);
    }

    const wrapper = el('div', 'table-scroll');
    const table = el('table', 'data-table');

    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const header of headers) {
        headRow.append(el('th', header.align === 'right' ? 'right' : '', header.label));
    }
    head.append(headRow);

    const body = document.createElement('tbody');
    for (const row of rows) {
        const tr = document.createElement('tr');
        if (row.onClick) {
            tr.className = 'entity-row';
            tr.addEventListener('click', row.onClick);
        }
        tr.append(...row.cells);
        body.append(tr);
    }

    table.append(head, body);
    wrapper.append(table);
    return wrapper;
}

function renderPager(container, page, onPage) {
    container.replaceChildren();

    if (page.total <= page.take) {
        container.hidden = true;
        return;
    }

    container.hidden = false;

    const previous = el('button', 'pager-button', '‹');
    previous.type = 'button';
    previous.setAttribute('aria-label', 'Previous page');
    previous.disabled = page.skip === 0;
    previous.addEventListener('click', () => onPage(Math.max(page.skip - page.take, 0)));

    const next = el('button', 'pager-button', '›');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next page');
    next.disabled = page.skip + page.take >= page.total;
    next.addEventListener('click', () => onPage(page.skip + page.take));

    const first = Math.min(page.skip + 1, page.total);
    const last = Math.min(page.skip + page.items.length, page.total);
    container.append(
        previous,
        el('span', 'pager-label', `${first}–${last} of ${page.total}`),
        next,
    );
}

function applySelectionStyles() {
    for (const button of document.querySelectorAll('.nav-button')) {
        const active = state.selection !== null
            && state.selection.kind === button.dataset.kind
            && state.selection.id === button.dataset.id;
        button.classList.toggle('active', active);
    }
}

function renderDirectory(pluralName) {
    const page = state.pages[pluralName] ?? { skip: 0, take: 0, total: 0, items: [] };
    const targets = directoryViews[pluralName];
    const kind = pluralToKind[pluralName];

    targets.list.replaceChildren();
    for (const entity of page.items) {
        const item = document.createElement('li');
        const button = el('button', 'nav-button');
        button.type = 'button';
        button.dataset.kind = kind;
        button.dataset.id = entity.id;
        button.append(el('span', '', entity.name), el('span', 'nav-meta', entity.id));
        button.addEventListener('click', () => navigate(kind, entity.id));
        item.append(button);
        targets.list.append(item);
    }

    targets.empty.hidden = page.items.length > 0;
    renderPager(targets.pager, page, (skip) => {
        loadDirectory(pluralName, skip).catch(showError);
    });

    applySelectionStyles();
}

async function loadDirectory(pluralName, skip = 0) {
    const page = await getJson(`/dev/${pluralName}?skip=${skip}&take=${DIRECTORY_PAGE_SIZE}`);
    state.pages[pluralName] = page;
    renderDirectory(pluralName);
}

function showView(kindLabel, title, idLabel, metric) {
    elements.viewKind.textContent = kindLabel;
    elements.viewTitle.textContent = title;
    elements.viewId.textContent = idLabel;

    if (metric) {
        elements.viewMetric.hidden = false;
        elements.viewMetricValue.textContent = String(metric.value);
        elements.viewMetricLabel.textContent = metric.label;
    } else {
        elements.viewMetric.hidden = true;
    }

    elements.viewBody.replaceChildren();
    elements.content.hidden = false;
    elements.loading.hidden = true;
}

function appendRelatedPager(page, onPage) {
    const pager = el('div', 'pager');
    renderPager(pager, page, onPage);
    elements.viewBody.append(pager);
}

function renderStationView(station, page) {
    showView('Station', station.name, `station / ${station.id}`, {
        value: page.total,
        label: 'inventories',
    });

    elements.viewBody.append(el('p', 'section-heading', 'Inventories located here'));

    const rows = page.items.map((inventory) => ({
        onClick: () => navigate('inventory', inventory.id),
        cells: [
            entityCell('inventory', inventory),
            refCell(inventory.owner),
            el('td', 'right', summarize(inventory.contents)),
        ],
    }));

    elements.viewBody.append(buildTable(
        [{ label: 'Inventory' }, { label: 'Owner' }, { label: 'Contents', align: 'right' }],
        rows,
        'No inventories are located here.',
    ));

    appendRelatedPager(page, (skip) => loadRelated({ kind: 'station', id: station.id }, skip, station));
}

function renderActorView(actor, page) {
    showView('Actor', actor.name, `actor / ${actor.id}`, {
        value: page.total,
        label: 'inventories',
    });

    elements.viewBody.append(el('p', 'section-heading', `Inventories owned by ${actor.name}`));

    const rows = page.items.map((inventory) => ({
        onClick: () => navigate('inventory', inventory.id),
        cells: [
            entityCell('inventory', inventory),
            refCell(inventory.location),
            el('td', 'right', summarize(inventory.contents)),
        ],
    }));

    elements.viewBody.append(buildTable(
        [{ label: 'Inventory' }, { label: 'Location' }, { label: 'Contents', align: 'right' }],
        rows,
        'This actor owns no inventories.',
    ));

    elements.viewBody.append(el(
        'p',
        'view-note',
        'Ownership does not imply physical presence. Actors have no location in this model yet.',
    ));

    appendRelatedPager(page, (skip) => loadRelated({ kind: 'actor', id: actor.id }, skip, actor));
}

function renderCommodityView(commodity, page) {
    showView('Commodity', commodity.name, `commodity / ${commodity.id}`, {
        value: page.total,
        label: 'inventories',
    });

    elements.viewBody.append(el('p', 'section-heading', `Inventories containing ${commodity.name}`));

    const rows = page.items.map((stock) => ({
        onClick: () => navigate('inventory', stock.inventoryId),
        cells: [
            entityCell('inventory', { id: stock.inventoryId, name: stock.inventoryName }),
            refCell(stock.owner),
            refCell(stock.location),
            el('td', 'right quantity', String(stock.quantity)),
        ],
    }));

    elements.viewBody.append(buildTable(
        [
            { label: 'Inventory' },
            { label: 'Owner' },
            { label: 'Location' },
            { label: 'Quantity', align: 'right' },
        ],
        rows,
        `No inventory currently holds ${commodity.name}.`,
    ));

    appendRelatedPager(page, (skip) => loadRelated({ kind: 'commodity', id: commodity.id }, skip, commodity));
}

function renderInventoryView(inventory) {
    showView('Inventory', inventory.name, `inventory / ${inventory.id}`, {
        value: inventory.contents.length,
        label: 'commodity lines',
    });

    const grid = el('dl', 'detail-grid');
    const fields = [
        ['Owner', refLink(inventory.owner)],
        ['Location', refLink(inventory.location)],
        [
            'Capacity',
            inventory.maxItemCount === null ? 'Unlimited' : `${inventory.maxItemCount} item units`,
        ],
    ];

    for (const [label, value] of fields) {
        const field = el('div', 'detail-field');
        const description = document.createElement('dd');
        if (typeof value === 'string') {
            description.textContent = value;
        } else {
            description.append(value);
        }
        field.append(el('dt', '', label), description);
        grid.append(field);
    }
    elements.viewBody.append(grid);

    elements.viewBody.append(el('p', 'contents-heading', 'Contents'));

    if (inventory.contents.length === 0) {
        elements.viewBody.append(el('p', 'empty-contents', 'Empty — no commodities stored.'));
        return;
    }

    const wrapper = el('div', 'table-scroll');
    const table = el('table', 'contents-table');

    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.append(
        el('th', '', 'Commodity'),
        el('th', '', 'Commodity ID'),
        el('th', 'right', 'Quantity'),
    );
    head.append(headRow);

    const body = document.createElement('tbody');
    for (const line of inventory.contents) {
        const row = document.createElement('tr');
        const commodityCell = document.createElement('td');
        commodityCell.append(linkButton('commodity', line.commodityId, line.commodityName));
        row.append(
            commodityCell,
            el('td', 'mono', line.commodityId),
            el('td', 'right quantity', String(line.quantity)),
        );
        body.append(row);
    }

    table.append(head, body);
    wrapper.append(table);
    elements.viewBody.append(wrapper);
}

function renderHome() {
    showView('Overview', 'Entity directories', 'Select any entity from the sidebar', null);

    const labels = {
        stations: 'Stations',
        actors: 'Actors',
        commodities: 'Commodities',
        inventories: 'Inventories',
    };

    const grid = el('div', 'stat-grid');
    for (const [pluralName, label] of Object.entries(labels)) {
        const total = state.pages[pluralName]?.total ?? 0;
        const card = el('div', 'stat-card');
        card.append(el('span', 'stat-count', String(total)), el('span', 'stat-label', label));
        grid.append(card);
    }

    elements.viewBody.append(grid);
    elements.viewBody.append(el(
        'p',
        'home-note',
        'Stations, actors, commodities, and inventories are independent entities. '
            + 'Relationships such as ownership and location are navigation context, not containment.',
    ));
}

function renderUnavailable(route) {
    showView(kinds[route.kind].label, 'Not available', `${route.kind} / ${route.id}`, null);
    elements.viewBody.append(el(
        'p',
        'empty-state',
        'The server did not return this entity. Use Refresh or choose another entity.',
    ));
}

async function loadRelated(route, skip, entity) {
    const encoded = encodeURIComponent(route.id);
    try {
        if (route.kind === 'station') {
            const page = await getJson(
                `/dev/stations/${encoded}/inventories?skip=${skip}&take=${RELATED_PAGE_SIZE}`,
            );
            renderStationView(entity, page);
        } else if (route.kind === 'actor') {
            const page = await getJson(
                `/dev/actors/${encoded}/inventories?skip=${skip}&take=${RELATED_PAGE_SIZE}`,
            );
            renderActorView(entity, page);
        } else {
            const page = await getJson(
                `/dev/commodities/${encoded}/inventories?skip=${skip}&take=${RELATED_PAGE_SIZE}`,
            );
            renderCommodityView(entity, page);
        }
    } catch (error) {
        showError(error);
    }
}

async function loadEntity(route) {
    const encoded = encodeURIComponent(route.id);

    if (route.kind === 'inventory') {
        renderInventoryView(await getJson(`/dev/inventories/${encoded}`));
        return;
    }

    const entity = await getJson(`/dev/${kinds[route.kind].plural}/${encoded}`);
    await loadRelated(route, 0, entity);
}

async function renderRoute() {
    const route = parseRoute();
    state.selection = route;
    applySelectionStyles();
    showError(null);

    if (route === null) {
        renderHome();
        return;
    }

    try {
        await loadEntity(route);
    } catch (error) {
        showError(error);
        renderUnavailable(route);
    }
}

async function refresh() {
    elements.refreshButton.disabled = true;
    elements.refreshButton.textContent = 'Refreshing…';

    try {
        await Promise.all(
            Object.keys(directoryViews).map((pluralName) => loadDirectory(pluralName)),
        );
        await renderRoute();
    } catch (error) {
        showError(error);
    } finally {
        elements.refreshButton.disabled = false;
        elements.refreshButton.textContent = 'Refresh';
    }
}

async function initialize() {
    elements.loading.hidden = false;
    elements.content.hidden = true;
    showError(null);

    try {
        await Promise.all(
            Object.keys(directoryViews).map((pluralName) => loadDirectory(pluralName)),
        );

        if (!location.hash) {
            const firstStation = state.pages.stations?.items[0];
            const target = firstStation
                ? `#/${kinds.station.plural}/${encodeURIComponent(firstStation.id)}`
                : '#/';
            history.replaceState(null, '', target);
        }

        await renderRoute();
        elements.loading.hidden = true;
        elements.content.hidden = false;
    } catch (error) {
        elements.loading.hidden = true;
        showError(error);
    }
}

elements.refreshButton.addEventListener('click', () => {
    refresh().catch(showError);
});

elements.homeButton.addEventListener('click', () => {
    if (location.hash === '#/') {
        renderRoute();
        return;
    }
    location.hash = '#/';
});

window.addEventListener('hashchange', () => {
    renderRoute();
});

initialize();
