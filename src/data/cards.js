/* Knowledge cards used by the RISC-V lab and the knowledge view.
   Fields: [thread, title, text, topic it connects to]. */
export const TH={build:['Build','var(--copper)'],ai:['AI-native','var(--violet)'],eco:['Open ecosystem','var(--oxide)']};
export const CARDS={
 register:['build','Registers','A RISC-V core keeps 32 registers of 32 bits each, x0 to x31, the fastest storage on the chip. Software names them by role: a0–a7 for arguments, t0–t6 for temporaries, s0–s11 for saved values.','architecture'],
 x0:['build','x0 is always zero','Writing to x0 does nothing and reading it always gives 0. This one trick removes whole instructions: "move" is addi rd, rs, 0 and "nop" is addi x0, x0, 0.','architecture'],
 pseudo:['build','Pseudo-instructions','li, mv, j, ble and others are shorthand the assembler expands into real instructions. The hardware stays small; the convenience lives in software.','architecture'],
 loadstore:['build','Load-store architecture','Only loads and stores touch memory; arithmetic works on registers. This RISC principle keeps every instruction simple enough to pipeline, from microcontrollers to AI servers.','architecture'],
 memory:['build','Memory and addresses','Memory is a long row of bytes, each with an address. A 32-bit word takes four bytes; RISC-V stores the lowest byte first (little-endian).','architecture'],
 li:['build','Big numbers: lui + addi','An instruction has only 12 bits for a number. To load a bigger one, lui sets the upper 20 bits and addi adds the rest; li does both for you.','architecture'],
 branch:['build','Branches','beq, bne, blt and bge compare two registers and jump if the condition holds. Every if and every loop in every program is built from them.','architecture'],
 label:['build','Labels','A label such as loop: names an instruction\'s address so branches can jump to it. The assembler turns it into an offset in the instruction\'s bits.','architecture'],
 cycles:['build','Cycles and time','Each instruction here takes one clock cycle, except divides. Time = cycles ÷ clock frequency, so a faster clock or fewer instructions both help.','design'],
 extensions:['build','Extensions','RISC-V is modular: a base set (I) plus optional letters such as M (multiply), A (atomics), F and D (floating point), C (compressed) and V (vector). A chip includes only what it needs.','architecture'],
 shift:['build','Shift and add','Doubling is a shift left by one bit. Shift-and-add multiplication handles one bit of the multiplier per step, which is also how simple hardware multipliers work.','design'],
 modular:['eco','RVA23: one target for software','Profiles fix a standard set of extensions so operating systems can rely on them. RVA23, ratified in 2024, is the profile that Ubuntu\'s RISC-V releases now require.','architecture'],
 dotproduct:['ai','The dot product','Multiply pairs of numbers and add them up. Each neuron in a neural network computes one, so AI chips are designed around doing trillions per second.','compute'],
 int8:['ai','8-bit numbers','AI models run well with small integers or 4- and 8-bit floats. Smaller numbers mean less memory traffic and smaller multipliers, which is why AI hardware packs several into one word.','accelerators'],
 unroll:['build','Loop unrolling','Doing two or four elements per loop turn spends fewer instructions on counting and branching. Compilers do it automatically; hardware designers count on it.','compute'],
 custom:['ai','Custom instructions','RISC-V reserves opcode space for instructions you invent. Adding one costs area and design effort but can make a specific job, such as AI math, several times faster.','accelerators'],
 area:['build','Area is cost','Every hardware unit takes silicon area, which costs money on every chip made and leaks power. A good instruction must earn its area across many programs.','yield'],
 opcode:['build','Opcodes','The lowest 7 bits of every instruction say what kind it is. custom-0 (0001011) is free for vendors, so custom instructions never clash with standard ones.','architecture'],
 relu:['ai','ReLU','The simplest activation function: negative values become zero, positive ones pass through. It is cheap in hardware, one compare per output.','compute'],
 layer:['ai','Layers','A layer is many neurons sharing the same inputs: a matrix times a vector. Stack layers and you have a neural network.','compute'],
 openisa:['eco','An open instruction set','RISC-V is a free, open standard run by RISC-V International, with over 4,200 member organizations. Anyone can build a core without a license fee, and many complete cores are open source.','ecosystem'],
 opentools:['eco','Open-source chip tools','A full open flow now exists: Yosys turns code into gates, OpenROAD places and routes them, and LibreLane (the successor to OpenLane, maintained at the FOSSi Foundation) ties the steps together.','design'],
 openpdk:['eco','Open PDKs and shuttles','SkyWater 130 nm, GlobalFoundries 180 nm and IHP 130 nm have open process design kits. Programs such as Tiny Tapeout let students put designs on real chips by sharing a wafer.','economics'],
 riscvai:['eco','RISC-V in AI chips','AI chip makers use RISC-V cores to control and feed their accelerators. Tenstorrent licensed SiFive\'s vector cores, and Meta bought the RISC-V chip startup Rivos in 2025.','accelerators'],
 copilot:['ai','Working with an AI copilot','AI can write and fix code quickly, but it can be confidently wrong. The habit that matters: state the goal precisely, then check every answer against tests.','innovation'],
 skills:['ai','Which skills last','When AI makes code cheap, value moves to specifying the right problem, judging results, verification, and the physical trade-offs of area, power and cost that software cannot undo.','innovation']
};
