const elements = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    content: document.getElementById('content'),
    stationList: document.getElementById('station-list'),
    actorList: document.getElementById('actor-list'),
    actorEmpty: document.getElementById('actor-empty'),
    commodityList: document.getElementById('commodity-list'),
    commodityEmpty: document.getElementById('commodity-empty'),
    stationName: document.getElementById('station-name'),
    stationId: document.getElementById('station-id'),
    inventoryCount: document.getElementById('inventory-count'),
    inventoryRows: document.getElementById('inventory-rows'),
    inventoryEmpty: document.getElementById('inventory-empty'),
    detailPanel: document.getElementById('detail-panel'),
    detailKind: document.getElementById('detail-kind'),
    detailTitle: document.getElementById('detail-title'),
    detailId: document.getElementById('detail-id'),
    detailBody: document.getElementById('detail-body'),
    detailClose: document.getElementById('detail-close'),
    refreshButton: document.getElementById('refresh-button'),
};

const state = {
    stations: [],
    stationId: null,
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

function refCell(reference) {
    const cell = el('td', 'ref');
    cell.append(el('span', 'ref-kind', `${reference.kind} / `), document.createTextNode(reference.id));
    return cell;
}

function renderStationNav() {
    elements.stationList.replaceChildren();

    for (const station of state.stations) {
        const item = document.createElement('li');
        const button = el('button', 'nav-button');
        button.type = 'button';
        button.dataset.kind = 'station';
        button.dataset.id = station.id;
        button.append(el('span', '', station.name), el('span', 'nav-meta', station.id));
        button.addEventListener('click', () => {
            loadStation(station.id).catch(showError);
        });
        item.append(button);
        elements.stationList.append(item);
    }
}

function addDiscovery(list, kind, id, label) {
    const item = document.createElement('li');
    const button = el('button', 'nav-button');
    button.type = 'button';
    button.dataset.kind = kind;
    button.dataset.id = id;
    button.append(el('span', '', label), el('span', 'nav-meta', id));
    button.addEventListener('click', () => {
        inspectEntity(kind, id).catch(showError);
    });
    item.append(button);
    list.append(item);
}

async function renderDiscovered(inventories) {
    const actors = new Set();
    const commodities = new Map();

    for (const inventory of inventories) {
        if (inventory.owner.kind === 'actor') {
            actors.add(inventory.owner.id);
        }
        for (const line of inventory.contents) {
            commodities.set(line.commodityId, line.commodityName);
        }
    }

    const actorEntries = await Promise.all(
        [...actors].map(async (id) => {
            try {
                const actor = await getJson(`/dev/actors/${encodeURIComponent(id)}`);
                return [id, actor.name];
            } catch {
                return [id, id];
            }
        }),
    );

    actorEntries.sort((left, right) => left[1].localeCompare(right[1]));
    elements.actorList.replaceChildren();
    for (const [id, label] of actorEntries) {
        addDiscovery(elements.actorList, 'actor', id, label);
    }
    elements.actorEmpty.hidden = actorEntries.length > 0;

    const commodityEntries = [...commodities.entries()].sort((left, right) =>
        left[1].localeCompare(right[1]),
    );
    elements.commodityList.replaceChildren();
    for (const [id, label] of commodityEntries) {
        addDiscovery(elements.commodityList, 'commodity', id, label);
    }
    elements.commodityEmpty.hidden = commodityEntries.length > 0;
}

function applySelectionStyles() {
    for (const button of document.querySelectorAll('.nav-button')) {
        const { kind, id } = button.dataset;
        const active = kind === 'station'
            ? id === state.stationId
            : state.selection !== null && state.selection.kind === kind && state.selection.id === id;
        button.classList.toggle('active', active);
    }

    for (const row of elements.inventoryRows.querySelectorAll('.inventory-row')) {
        row.classList.toggle(
            'active',
            state.selection !== null
                && state.selection.kind === 'inventory'
                && state.selection.id === row.dataset.inventoryId,
        );
    }
}

function renderStation(station, page) {
    elements.stationName.textContent = station.name;
    elements.stationId.textContent = `id ${station.id}`;
    elements.inventoryCount.textContent = String(page.total);
    elements.inventoryRows.replaceChildren();

    for (const inventory of page.inventories) {
        const row = document.createElement('tr');
        row.className = 'inventory-row';
        row.tabIndex = 0;
        row.dataset.inventoryId = inventory.id;
        row.setAttribute('role', 'button');
        row.setAttribute('aria-label', `Inspect ${inventory.name}`);
        row.addEventListener('click', () => {
            inspectInventory(inventory.id).catch(showError);
        });
        row.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                inspectInventory(inventory.id).catch(showError);
            }
        });

        const nameCell = document.createElement('td');
        nameCell.append(
            el('span', 'inventory-name', inventory.name),
            el('span', 'inventory-id', inventory.id),
        );

        const contentsCell = el('td', 'right', summarize(inventory.contents));

        row.append(nameCell, refCell(inventory.owner), refCell(inventory.location), contentsCell);
        elements.inventoryRows.append(row);
    }

    elements.inventoryEmpty.hidden = page.inventories.length > 0;
}

function hideDetail() {
    elements.detailPanel.hidden = true;
    elements.detailBody.replaceChildren();
}

function showDetail(kind, title, id) {
    elements.detailKind.textContent = kind;
    elements.detailTitle.textContent = title;
    elements.detailId.textContent = `id ${id}`;
    elements.detailPanel.hidden = false;
}

function buildDetailBody(fields, contents) {
    elements.detailBody.replaceChildren();

    const grid = el('dl', 'detail-grid');
    for (const [label, value] of fields) {
        const field = el('div', 'detail-field');
        field.append(el('dt', '', label), el('dd', '', value));
        grid.append(field);
    }
    elements.detailBody.append(grid);

    if (contents === null) {
        return;
    }

    elements.detailBody.append(el('p', 'contents-heading', 'Contents'));

    if (contents.length === 0) {
        elements.detailBody.append(el('p', 'empty-contents', 'Empty — no commodities stored.'));
        return;
    }

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
    for (const line of contents) {
        const row = document.createElement('tr');
        row.append(
            el('td', '', line.commodityName),
            el('td', 'mono', line.commodityId),
            el('td', 'right quantity', String(line.quantity)),
        );
        body.append(row);
    }

    table.append(head, body);
    elements.detailBody.append(table);
}

async function inspectInventory(inventoryId) {
    const inventory = await getJson(`/dev/inventories/${encodeURIComponent(inventoryId)}`);
    state.selection = { kind: 'inventory', id: inventory.id };

    showDetail('Inventory', inventory.name, inventory.id);
    buildDetailBody(
        [
            ['Owner', `${inventory.owner.kind} / ${inventory.owner.id}`],
            ['Location', `${inventory.location.kind} / ${inventory.location.id}`],
            [
                'Capacity',
                inventory.maxItemCount === null ? 'Unlimited' : `${inventory.maxItemCount} item units`,
            ],
        ],
        inventory.contents,
    );

    applySelectionStyles();
    elements.detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function inspectEntity(kind, id) {
    const endpoint = kind === 'actor' ? 'actors' : 'commodities';
    const entity = await getJson(`/dev/${endpoint}/${encodeURIComponent(id)}`);
    state.selection = { kind, id: entity.id };

    showDetail(kind === 'actor' ? 'Actor' : 'Commodity', entity.name, entity.id);
    buildDetailBody(
        [
            ['Entity kind', kind],
            ['Stable ID', entity.id],
            ['Display name', entity.name],
        ],
        null,
    );

    applySelectionStyles();
    elements.detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function loadStation(stationId, { keepSelection = false } = {}) {
    if (!keepSelection) {
        state.selection = { kind: 'station', id: stationId };
    }

    const [station, page] = await Promise.all([
        getJson(`/dev/stations/${encodeURIComponent(stationId)}`),
        getJson(`/dev/stations/${encodeURIComponent(stationId)}/inventories?take=100`),
    ]);

    state.stationId = station.id;
    renderStation(station, page);
    await renderDiscovered(page.inventories);
    applySelectionStyles();

    if (!keepSelection) {
        hideDetail();
    }
    showError(null);
}

async function refresh() {
    elements.refreshButton.disabled = true;
    elements.refreshButton.textContent = 'Refreshing…';

    try {
        if (state.stationId === null) {
            await initialize();
            return;
        }

        const selection = state.selection;
        await loadStation(state.stationId, { keepSelection: true });

        if (selection !== null && selection.kind === 'inventory') {
            await inspectInventory(selection.id);
        } else if (selection !== null && selection.kind === 'actor') {
            await inspectEntity('actor', selection.id);
        } else if (selection !== null && selection.kind === 'commodity') {
            await inspectEntity('commodity', selection.id);
        }
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
        state.stations = await getJson('/dev/stations');
        renderStationNav();

        if (state.stations.length === 0) {
            throw new Error('The development world contains no stations.');
        }

        await loadStation(state.stations[0].id);
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

elements.detailClose.addEventListener('click', () => {
    state.selection = state.stationId === null
        ? null
        : { kind: 'station', id: state.stationId };
    hideDetail();
    applySelectionStyles();
});

initialize();
