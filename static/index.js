"use strict";

class DefaultConfBlock extends Block {

    constructor(name, type, x, y, w, h, in_qtd, out_qtd) {
        super(name, x, y, w, h, in_qtd, out_qtd)

        this.type = type;
        this.config = {};

        for(let prop in type.config) {
            if(type.config.hasOwnProperty(prop)) {
                this.config[prop] = type.config[prop] == 'String' ? '' : 0;
            }
        }
    }

    setConfig(prop, value) {

        const prop_type = this.type.config[prop];

        switch(prop_type) {

            case 'Integer':
                this.config[prop] = parseInt(value, 10);
                break;
            case 'Real':
                this.config[prop] = parseFloat(value);
                break;
            default:
                this.config[prop] = value
        }
    }

    saveJSON(stringify) {

        let ret_json = super.saveJSON(false);

        ret_json.config = this.config;
        ret_json.type = this.type.name;

        if(stringify !== false) return JSON.stringify(obj);

        return ret_json;
    }
}

function addButtonOnClick() {

    const json_prop_arr = [];
    for(let prop in configblock_types) {
        if(configblock_types.hasOwnProperty(prop)) {
            json_prop_arr.push(prop);
        }
    }

    const blocktype_prompt_string = `Block type('${json_prop_arr.join("', '")}'): `;

    let block_type_name = prompt(blocktype_prompt_string);

    while(block_type_name != null && !json_prop_arr.includes(block_type_name)) {

        block_type_name = prompt(blocktype_prompt_string, block_type_name);
    }

    if(block_type_name == null) return;

    const block_type = configblock_types[block_type_name];

    block_type.name = block_type_name;

    const block_name = prompt("Block name: ");
    if(block_name != null) {

        const new_block = new DefaultConfBlock(block_name, block_type, 20, 20, 90, 50,
                                               block_type.n_input, block_type.n_output);

        if(!block_viewer.addBlock(new_block)) {

            alert(`There is already a block named '${block_name}'`)
        }
    }
}

function deleteButtonOnClick() {

    block_viewer.remBlock(selected_block);

    blockSelected(null);
}

function saveButtonOnClick() {

    axios.post('/blocks/save', block_viewer.saveJSON(), {

        headers: {
            "Accept": "application/json",
            "Content-type": "application/json"
        }
    }).then((response) => { alert('Saved'); }, (error) => { alert('Failed to save'); });
}

function downloadButtonOnClick() {

    var download_data = "data:text/json;charset=utf-8," + encodeURIComponent(block_viewer.saveJSON());
    var download_hidden_link = document.getElementById('download-hidden-link');
    download_hidden_link.setAttribute("href", download_data);
    download_hidden_link.setAttribute("download", "blocks.json");
    download_hidden_link.click();
}

function blockSelected(block) {

    selected_block = block;

    const delete_button = document.getElementById("delete-button");
    const block_name_element = document.getElementById("block-name");
    const block_type_element = document.getElementById("block-type");
    const block_config_element = document.getElementById("block-config");

    if(block == null) {

        block_name_element.innerHTML = "None";
        block_type_element.innerHTML = "None";
        delete_button.disabled = true;
        block_config_element.style.visibility = "hidden";
    }
    else {

        block_name_element.innerHTML = block.name;
        block_type_element.innerHTML = block.type.name;
        delete_button.disabled = false;

        block_config_element.innerHTML = '';
        for(let prop in block.type.config) {
            if(block.type.config.hasOwnProperty(prop)) {

                const new_p_element = document.createElement('p');

                new_p_element.innerHTML = `${prop}: `;

                block_config_element.appendChild(new_p_element);

                const new_input_element = document.createElement('input');

                const new_input_el_id = `block-config-input-${prop}`;

                new_input_element.setAttribute('id', new_input_el_id);
                new_input_element.setAttribute('type', 'text');
                new_input_element.setAttribute('value', block.config[prop]);
                new_input_element.setAttribute(
                    'oninput', `configInputOnChange('${prop}', '${new_input_el_id}');`);

                new_p_element.appendChild(new_input_element);
            }
        }

        block_config_element.style.visibility = "visible";
    }
}

function configInputOnChange(prop, new_input_el_id) {

    const element = document.getElementById(new_input_el_id);

    selected_block.setConfig(prop, element.value);
}

var block_viewer = new CanvasBlockViewer('canvas');
var selected_block = null;
var configblock_types = null;

block_viewer.select_callback = blockSelected;

axios.get('/config/blocks/types').then((response) => {

    configblock_types = response.data;
})
