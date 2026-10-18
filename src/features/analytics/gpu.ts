/// <reference types="@webgpu/types" />

/**
 * WebGPU のコンピュートシェーダーでヒストグラム(ビンごとの件数)を数える。
 * 使えない環境では null を返すので、呼び出し側で CPU 計算にフォールバックすること。
 */
const SHADER = /* wgsl */ `
@group(0) @binding(0) var<storage, read> bins: array<u32>;
@group(0) @binding(1) var<storage, read_write> counts: array<atomic<u32>>;
@group(0) @binding(2) var<uniform> n: u32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= n) { return; }
  let b = bins[id.x];
  if (b < arrayLength(&counts)) {
    atomicAdd(&counts[b], 1u);
  }
}
`;

let devicePromise: Promise<GPUDevice | null> | null = null;

async function getDevice(): Promise<GPUDevice | null> {
  if (!('gpu' in navigator) || !navigator.gpu) return null;
  devicePromise ??= navigator.gpu
    .requestAdapter()
    .then((a) => a?.requestDevice() ?? null)
    .catch(() => null);
  return devicePromise;
}

export async function histogramGpu(bins: Uint32Array, size: number): Promise<number[] | null> {
  const device = await getDevice();
  if (!device || bins.length === 0) return null;
  try {
    const binBuf = device.createBuffer({ size: Math.max(4, bins.byteLength), usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(binBuf, 0, bins);
    const countBuf = device.createBuffer({ size: size * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
    const nBuf = device.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(nBuf, 0, new Uint32Array([bins.length]));
    const readBuf = device.createBuffer({ size: size * 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });

    const pipeline = device.createComputePipeline({
      layout: 'auto',
      compute: { module: device.createShaderModule({ code: SHADER }), entryPoint: 'main' },
    });
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: binBuf } },
        { binding: 1, resource: { buffer: countBuf } },
        { binding: 2, resource: { buffer: nBuf } },
      ],
    });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(bins.length / 64));
    pass.end();
    encoder.copyBufferToBuffer(countBuf, 0, readBuf, 0, size * 4);
    device.queue.submit([encoder.finish()]);

    await readBuf.mapAsync(GPUMapMode.READ);
    const result = Array.from(new Uint32Array(readBuf.getMappedRange().slice(0)));
    readBuf.unmap();
    [binBuf, countBuf, nBuf, readBuf].forEach((b) => b.destroy());
    return result;
  } catch {
    return null;
  }
}
