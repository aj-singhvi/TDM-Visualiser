document.addEventListener('DOMContentLoaded', () => {
    const num_senders_input = document.getElementById('num-senders');
    const sender_messages_inputs_div = document.getElementById('sender-messages-inputs');
    const bits_per_slot_input = document.getElementById('bits-per-slot');
    const input_rate_input = document.getElementById('input-rate');
    const setup_button = document.getElementById('setup-button');
    const senders_area = document.getElementById('senders-area');
    const receivers_area = document.getElementById('receivers-area');
    const frame_construction_area = document.getElementById('frame-construction');
    const channel_area = document.getElementById('channel');
    const status_message_span = document.getElementById('status-message');

    const param_frame_size = document.getElementById('param-frame-size');
    const param_input_slot_time = document.getElementById('param-input-slot-time');
    const param_output_slot_time = document.getElementById('param-output-slot-time');
    const param_frame_time = document.getElementById('param-frame-time');
    const param_frame_rate = document.getElementById('param-frame-rate');
    const param_bit_rate = document.getElementById('param-bit-rate');

    let num_senders = 0;
    let bits_per_slot = 0;
    let input_rate = 0;
    let sender_messages = [];
    let sender_data_buffers = [];
    let receiver_data_buffers = [];
    let sender_elements = [];
    let receiver_elements = [];
    let current_frame_slots = [];
    let frame_number = 0;
    let is_playing = false;
    let simulation_interval_id = null;
    let active_frames = [];
    const FRAME_VISUAL_TRAVEL_TIME = 5000;
    const FRAME_SPACING = 150; // Spacing between frames in pixels

    generate_sender_inputs(parseInt(num_senders_input.value, 10));

    num_senders_input.addEventListener('input', () => {
        const count = parseInt(num_senders_input.value, 10);
        if (count > 0 && count <= 10) {
            generate_sender_inputs(count);
        }
        reset_simulation_view();
    });

    setup_button.addEventListener('click', initialize_simulation);

    function generate_sender_inputs(count) {
        sender_messages_inputs_div.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const input_group = document.createElement('div');
            input_group.classList.add('input-group');

            const label = document.createElement('label');
            
            label.setAttribute('for', `sender-msg-${i}`);
            label.textContent = `Sender ${i}:`;

            const input = document.createElement('input');
            input.setAttribute('type', 'text');
            input.setAttribute('id', `sender-msg-${i}`);
            input.setAttribute('placeholder', `Message by sender ${i}`);
            const default_messages = ["message by user 1", "message by user     2", "message by user 3", "", "", "", "", "", "", ""];
            input.value = default_messages[i % default_messages.length] || `Msg${i}`;

            input_group.appendChild(label);
            input_group.appendChild(input);
            sender_messages_inputs_div.appendChild(input_group);
        }
    }

    function initialize_simulation() {
        document.getElementsByClassName('visualization card')[0].scrollIntoView();
        reset_simulation();

        num_senders = parseInt(num_senders_input.value, 10);
        bits_per_slot = parseInt(bits_per_slot_input.value, 10);
        input_rate = parseFloat(input_rate_input.value); 

        if (num_senders <= 0 || bits_per_slot <= 0 || input_rate <= 0) {
            update_status("Invalid input values.", "error");
            return;
        }

        sender_messages = [];
        sender_data_buffers = [];
        receiver_data_buffers = [];
        for (let i = 0; i < num_senders; i++) {
            const input = document.getElementById(`sender-msg-${i}`);
            const message = input ? input.value : '';
            sender_messages.push(message);
            sender_data_buffers.push(Array.from(message));
            receiver_data_buffers.push('');
        }

        create_sender_receiver_elements();
        initialize_channel();
        calculate_and_display_parameters();

        update_status("Simulation running...", "running");
        frame_number = 0;
        start_simulation();
    }

    function reset_simulation() {
        if (simulation_interval_id) {
            clearInterval(simulation_interval_id);
            simulation_interval_id = null;
        }
        is_playing = false;

        senders_area.innerHTML = '<h3>Senders</h3>';
        receivers_area.innerHTML = '<h3>Receivers</h3>';
        frame_construction_area.innerHTML = '<div class="label">Frame Assembly</div>';
        channel_area.innerHTML = '';

        sender_messages = [];
        sender_data_buffers = [];
        receiver_data_buffers = [];
        sender_elements = [];
        receiver_elements = [];
        current_frame_slots = [];
        frame_number = 0;
        active_frames = [];

        param_frame_size.textContent = '--';
        param_input_slot_time.textContent = '--';
        param_output_slot_time.textContent = '--';
        param_frame_time.textContent = '--';
        param_frame_rate.textContent = '--';
        param_bit_rate.textContent = '--';
        update_status("Idle", "idle");
    }

    function reset_simulation_view() {
        if (simulation_interval_id) {
            clearInterval(simulation_interval_id);
            simulation_interval_id = null;
        }
        is_playing = false;

        senders_area.innerHTML = '<h3>Senders</h3>';
        receivers_area.innerHTML = '<h3>Receivers</h3>';
        frame_construction_area.innerHTML = '<div class="label">Frame Assembly</div>';
        channel_area.innerHTML = '';
        active_frames = [];

        param_frame_size.textContent = '--';
        param_input_slot_time.textContent = '--';
        param_output_slot_time.textContent = '--';
        param_frame_time.textContent = '--';
        param_frame_rate.textContent = '--';
        param_bit_rate.textContent = '--';
        update_status("Idle - Adjust settings and Initialize", "idle");
    }

    function create_sender_receiver_elements() {
        senders_area.innerHTML = '<h3>Senders</h3>';
        receivers_area.innerHTML = '<h3>Receivers</h3>';
        sender_elements = [];
        receiver_elements = [];

        for (let i = 0; i < num_senders; i++) {
            const sender_div = document.createElement('div');
            sender_div.classList.add('sender', `sender-${i % 10}`);
            
            const senderDataPre = document.createElement('pre');
            senderDataPre.classList.add('sender-data');
            senderDataPre.style.fontFamily = "'Courier New', Courier, monospace";
            senderDataPre.style.margin = "0";
            senderDataPre.style.whiteSpace = "pre-wrap";
            senderDataPre.style.wordBreak = "break-word";
            senderDataPre.textContent = sender_messages[i] || '(empty)';
            
            sender_div.innerHTML = `<span class="sender-id">Sender ${i}</span>`;
            sender_div.appendChild(senderDataPre);
            
            senders_area.appendChild(sender_div);
            sender_elements.push(sender_div);

            const receiver_div = document.createElement('div');
            receiver_div.classList.add('receiver', `receiver-${i % 10}`);
            
            const receiverDataPre = document.createElement('pre');
            receiverDataPre.classList.add('receiver-data');
            receiverDataPre.style.fontFamily = "'Courier New', Courier, monospace";
            receiverDataPre.style.margin = "0";
            receiverDataPre.style.whiteSpace = "pre-wrap";
            receiverDataPre.style.wordBreak = "break-word";
            
            receiver_div.innerHTML = `<span class="receiver-id">Receiver ${i}</span>`;
            receiver_div.appendChild(receiverDataPre);
            
            receivers_area.appendChild(receiver_div);
            receiver_elements.push(receiver_div);
        }
    }

    function start_simulation() {
        is_playing = true;
        if (simulation_interval_id) {
            clearInterval(simulation_interval_id);
        }
        const animation_interval = Math.floor(1000 / input_rate);
        simulation_interval_id = setInterval(simulation_step, animation_interval);
    }

    function simulation_step() {
        if (!is_playing) return;

        let frame_launched_this_step = false;
        const can_launch_frame = active_frames.length === 0 || 
            (active_frames.length > 0 && 
             active_frames[active_frames.length - 1].position > FRAME_SPACING);

        if (current_frame_slots.length === 0 && can_launch_frame) {
            let data_taken_this_cycle = false;
            let is_any_sender_active = false;

            frame_construction_area.innerHTML = '<div class="label">Frame Assembly</div>';

            for (let i = 0; i < num_senders; i++) {
                 if (sender_data_buffers[i] && sender_data_buffers[i].length > 0) {
                    is_any_sender_active = true;
                    const sender_buffer = sender_data_buffers[i];
                    const data_to_send = sender_buffer.splice(0, bits_per_slot);

                    if (data_to_send.length > 0) {
                        data_taken_this_cycle = true;
                        update_sender_display(i);
                    }
                     const slot_data = data_to_send.join('');
                     current_frame_slots.push({ sender: i, data: slot_data });

                     const slot_element = document.createElement('div');
                     slot_element.classList.add('frame-slot', `sender-color-${i % 10}`);
                     
                     const display_text = slot_data ? slot_data.replace(/ /g, '␣') : '_';
                     slot_element.textContent = display_text;
                     
                     slot_element.dataset.actualData = slot_data;
                     
                     frame_construction_area.appendChild(slot_element);

                 } else {
                    current_frame_slots.push({ sender: i, data: '' });
                    const slot_element = document.createElement('div');
                    slot_element.classList.add('frame-slot', `sender-color-${i % 10}`);
                    slot_element.textContent = '_';
                    frame_construction_area.appendChild(slot_element);
                 }
            }

             if (!is_any_sender_active && active_frames.length === 0) {
                 finish_simulation();
                 return;
             }

             if (!data_taken_this_cycle && active_frames.length === 0 && !is_any_sender_active) {
                 finish_simulation();
                 return;
             }
        }

        if (current_frame_slots.length >= num_senders && can_launch_frame) {
            if (current_frame_slots.some(slot => slot.data.length > 0)) {
                 create_and_launch_frame();
                 frame_launched_this_step = true;
            }
             frame_construction_area.innerHTML = '<div class="label">Frame Assembly</div>';
             current_frame_slots = [];
        }

        move_frames_on_channel();

        if (is_simulation_complete_check() && active_frames.length === 0 && current_frame_slots.length === 0) {
            finish_simulation();
            return;
        }

        calculate_and_display_parameters();
    }

    function create_and_launch_frame() {
        const frame_element = document.createElement('div');
        frame_element.classList.add('frame');
        frame_number++;
        frame_element.dataset.frame_number = frame_number;
        
        const frame_data = [];
        
        current_frame_slots.forEach(slot => {
          const slot_element = document.createElement('div');
          slot_element.classList.add('frame-slot', `sender-color-${slot.sender % 10}`);
          
          const display_text = slot.data ? slot.data.replace(/ /g, '␣') : '_';
          slot_element.textContent = display_text;
          
          slot_element.dataset.actualData = slot.data;
          slot_element.dataset.sender_index = slot.sender;
          
          frame_element.appendChild(slot_element);
          frame_data.push(slot);
        });
        
        frame_element.style.position = 'absolute';
        frame_element.style.left = '0px';
        frame_element.style.top = '50%';
        frame_element.style.transform = 'translateY(-50%)';
        
        channel_area.appendChild(frame_element);
        
        active_frames.push({
          element: frame_element,
          data: frame_data,
          position: 0,
          start_time: Date.now()
        });
    }
      
    function move_frames_on_channel() {
        const now = Date.now();
        const channel_width = channel_area.offsetWidth;
        
        for (let i = active_frames.length - 1; i >= 0; i--) {
          const frame = active_frames[i];
          const elapsed_time = now - frame.start_time;
          
          const progress = Math.min(1, elapsed_time / FRAME_VISUAL_TRAVEL_TIME);
          const position = progress * channel_width;
          
          frame.element.style.left = `${position}px`;
          frame.position = position; 
          
          if (progress >= 1) {
            process_frame_data(frame.data);
            
            frame.element.remove();
            active_frames.splice(i, 1);
          }
        }
    }
      
    function process_frame_data(frame_data) {
        frame_data.forEach(slot => {
          if (slot.data !== null && slot.data !== undefined) {
            const receiver_index = slot.sender;
            receiver_data_buffers[receiver_index] += slot.data;
            update_receiver_display(receiver_index);
          }
        });
    }
      
    function initialize_channel() {
        channel_area.innerHTML = '';
        
        const horizontal_channel = document.createElement('div');
        horizontal_channel.classList.add('horizontal-channel');
        
        const mux = document.createElement('div');
        mux.classList.add('mux');
        mux.innerHTML = '<div class="mux-label">MUX</div>';
        
        const demux = document.createElement('div');
        demux.classList.add('demux');
        demux.innerHTML = '<div class="demux-label">DEMUX</div>';
        
        const channel_line = document.createElement('div');
        channel_line.classList.add('channel-line');
        
        horizontal_channel.appendChild(mux);
        horizontal_channel.appendChild(channel_line);
        horizontal_channel.appendChild(demux);
        channel_area.appendChild(horizontal_channel);
    }
      
    const style_element = document.createElement('style');
    style_element.textContent = `
    .horizontal-channel {
      display: flex;
      align-items: center;
      width: 100%;
      height: 80px;
      position: relative;
    }
    
    .channel-line {
      flex-grow: 1;
      height: 8px;
      background-color: #333;
      margin: 0 10px;
      position: relative;
    }
    
    .mux, .demux {
      width: 80px;
      height: 80px;
      background-color: #555;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 10px;
      color: white;
      font-weight: bold;
      position: relative;
      z-index: 2;
    }
    
    .mux-label, .demux-label {
      text-align: center;
    }
    
    .frame {
      display: flex;
      background-color: rgba(255, 255, 255, 0.8);
      border: 2px solid #333;
      border-radius: 5px;
      padding: 5px;
      gap: 2px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 1;
      transition: left 0.5s linear;
    }
    
    .frame-slot {
      padding: 2px 4px;
      min-width: 20px;
      text-align: center;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }

    .new-data {
      animation: highlight 0.5s ease-in-out;
    }
    
    @keyframes highlight {
      0% { background-color: transparent; }
      50% { background-color: rgba(255, 255, 0, 0.3); }
      100% { background-color: transparent; }
    }
    `;
    document.head.appendChild(style_element);
      
    function update_receiver_display(index) {
        if (receiver_elements[index]) {
          const data_div = receiver_elements[index].querySelector('.receiver-data');
          if (data_div) {
            data_div.textContent = receiver_data_buffers[index];
            
            data_div.classList.add('new-data');
            setTimeout(() => {
              data_div.classList.remove('new-data');
            }, 500);
          }
        }
    }

    function update_sender_display(index) {
        if (sender_elements[index]) {
            const data_div = sender_elements[index].querySelector('.sender-data');
            if (data_div) {
                data_div.textContent = sender_data_buffers[index].join('');
            }
        }
    }

    function calculate_and_display_parameters() {
        if (num_senders > 0 && bits_per_slot > 0 && input_rate > 0) {
            const frame_size = num_senders * bits_per_slot;
            const input_slot_time = (bits_per_slot / input_rate) * 1000;
            const channel_data_rate = num_senders * input_rate;
            const output_slot_time = input_slot_time / num_senders;
            const frame_time = frame_size / channel_data_rate * 1000;
            const frame_rate = 1000 / frame_time;
    
            param_frame_size.textContent = `${frame_size} characters`;
            param_input_slot_time.textContent = `${input_slot_time.toFixed(2)} ms`;
            param_output_slot_time.textContent = `${output_slot_time.toFixed(2)} ms`;
            param_frame_time.textContent = `${frame_time.toFixed(2)} ms`;
            param_frame_rate.textContent = `${frame_rate} frames/sec`;
            param_bit_rate.textContent = `${channel_data_rate.toFixed(3)} char/sec`;
        }
    }

    function update_status(message, status) {
        status_message_span.textContent = message;
        status_message_span.className = '';
        if (status) {
            status_message_span.classList.add(status);
        }
    }
    
    function is_simulation_complete_check() {
        for (let i = 0; i < num_senders; i++) {
            if (sender_data_buffers[i] && sender_data_buffers[i].length > 0) {
                return false;
            }
        }
        return true;
    }

    function finish_simulation() {
        if (is_playing) {
            clearInterval(simulation_interval_id);
            simulation_interval_id = null;
            is_playing = false;
            update_status("Finished: All data sent.", "finished");
            
            let all_messages_match = true;
            for (let i = 0; i < num_senders; i++) {
                if (sender_messages[i] !== receiver_data_buffers[i]) {
                    all_messages_match = false;
                    console.error(`Message mismatch for sender ${i}:`);
                    console.error(`Original: "${sender_messages[i]}"`);
                    console.error(`Received: "${receiver_data_buffers[i]}"`);
                }
            }
            
            if (!all_messages_match) {
                update_status("Finished with errors: Some messages were not transmitted correctly.", "error");
            } else {
                update_status("Finished: All data sent and received correctly.", "finished");
            }
        }
    }
});