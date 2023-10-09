from __future__ import annotations

import logging
import os
import platform
import random
import re
import subprocess
import time
from collections import deque
from dataclasses import dataclass
from itertools import count
from threading import Lock, Thread
from typing import Deque

import psutil
import pynvml
from fastapi import FastAPI, Response, status
from starlette.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger("uvicorn")


@app.get("/api/v1/health")
def get_health():
    return "I am alive :)"


class Cpu:
    def __init__(self, window=60) -> None:
        self.window = window

        psutil.cpu_percent(interval=None, percpu=False)

        self._percents: list[dict[str, float]] = []
        self._memory_percents: list[dict[str, float]] = []

        self._lock_cpu = Lock()
        self._lock_memory = Lock()

        self._process = Thread(target=self._loop, daemon=True)
        self._process.start()

    def _loop(self) -> None:
        while True:
            data = {f"{i}": v for i, v in enumerate(psutil.cpu_percent(interval=None, percpu=True))}
            data["name"] = f"{time.time()}"
            with self._lock_cpu:
                if len(self._percents) > self.window:
                    self._percents.pop(0)

                self._percents.append(data)

            data = {"name": f"{time.time()}", "data": psutil.virtual_memory().percent}
            with self._lock_memory:
                if len(self._memory_percents) > self.window:
                    self._memory_percents.pop(0)

                self._memory_percents.append(data)

            time.sleep(1.0)

    @property
    def name(self) -> str:
        if platform.system() == "Windows":
            name = platform.processor()
        elif platform.system() == "Darwin":
            os.environ["PATH"] = os.environ["PATH"] + os.pathsep + "/usr/sbin"
            name = subprocess.check_output("sysctl -n machdep.cpu.brand_string").strip()
        else:
            output = subprocess.check_output("cat /proc/cpuinfo", shell=True).decode().strip()
            name = [
                re.sub(".*model name.*:", "", line, 1)
                for line in output.split("\n")
                if "model name" in line
            ][0]

        return name

    @property
    def percent(self) -> float:
        return psutil.cpu_percent(interval=None, percpu=False)

    @property
    def percents(self) -> list[dict[str, float]]:
        with self._lock_cpu:
            return self._percents

    @property
    def memory_percents(self) -> list[dict[str, float]]:
        with self._lock_memory:
            return self._memory_percents

    @property
    def min_frequency(self) -> str:
        return psutil.cpu_freq().min * 1e6

    @property
    def max_frequency(self) -> str:
        return psutil.cpu_freq().max * 1e6

    @property
    def frequency(self) -> str:
        return psutil.cpu_freq(percpu=False).current * 1e6 + random.uniform(0, 1e-3)

    @property
    def frequencies(self) -> str:
        return [
            freq.current * 1e6 + random.uniform(0, 1e-3) for freq in psutil.cpu_freq(percpu=True)
        ]

    @property
    def logical_count(self) -> int:
        return psutil.cpu_count(logical=True)

    @property
    def physical_count(self) -> int:
        return psutil.cpu_count(logical=False)

    @property
    def loadavg(self) -> tuple[str, str, str]:
        return tuple(f"{x / psutil.cpu_count() * 100:4.1f}".strip() for x in psutil.getloadavg())

    @property
    def temperature(self) -> float | None:
        if (temp := psutil.sensors_temperatures().get("coretemp")) is None:
            return None

        return temp[0].current


cpu = Cpu()


@app.get("/api/v1/cpu/{name}")
def get_cpu_data(name: str, response: Response):
    if (attr := getattr(cpu, name, None)) is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return None

    response.status_code = status.HTTP_200_OK
    return attr


@app.get("/api/v1/memory/total")
def get_memory_total():
    return psutil.virtual_memory().total


@app.get("/api/v1/memory/available")
def get_memory_available():
    return psutil.virtual_memory().available


@app.get("/api/v1/memory/used")
def get_memory_used():
    memory = psutil.virtual_memory()
    return memory.total * memory.percent / 100


@app.get("/api/v1/memory/percent")
def get_memory_percent():
    return psutil.virtual_memory().percent


@app.get("/api/v1/memory/percents")
def get_memory_percents():
    return cpu.memory_percents


def filter_partitions(partitions: list) -> tuple:
    return tuple(
        p
        for p in partitions
        if p.fstype not in ("tmpfs", "squashfs", "devtmpfs", "vfat")
        and not p.mountpoint.startswith("/var")
        and not p.mountpoint.startswith("/boot")
        and not p.mountpoint.startswith("/snap")
    )


@app.get("/api/v1/disk/usages")
def get_disk_usages():
    partitions = tuple(
        p
        for p in psutil.disk_partitions()
        if p.fstype not in ("tmpfs", "squashfs", "devtmpfs", "vfat")
        and not p.mountpoint.startswith("/var")
        and not p.mountpoint.startswith("/boot")
        and not p.mountpoint.startswith("/snap")
    )

    return {
        p.mountpoint: {
            "total": psutil.disk_usage(p.mountpoint).total,
            "used": psutil.disk_usage(p.mountpoint).used,
            "free": psutil.disk_usage(p.mountpoint).free,
            "percent": psutil.disk_usage(p.mountpoint).percent,
        }
        for p in sorted(partitions, key=lambda p: psutil.disk_usage(p.mountpoint).total)
    }


class DiskNetwork:
    def __init__(self) -> None:
        self._disk_read: float = 0.0
        self._disk_write: float = 0.0
        self._network_recv: float = 0.0
        self._network_sent: float = 0.0

        self._lock = Lock()

        self._process = Thread(target=self._loop, daemon=True)
        self._process.start()

    def _loop(self) -> None:
        last_disk = psutil.disk_io_counters()
        last_network = psutil.net_io_counters()

        while True:
            time.sleep(1.0)

            disk = psutil.disk_io_counters()
            network = psutil.net_io_counters()

            with self._lock:
                self._disk_read = disk.read_bytes - last_disk.read_bytes
                self._disk_write = disk.write_bytes - last_disk.write_bytes
                self._network_recv = network.bytes_recv - last_network.bytes_recv
                self._network_sent = network.bytes_sent - last_network.bytes_sent

            last_disk = disk
            last_network = network

    @property
    def disk_read(self):
        with self._lock:
            return self._disk_read

    @property
    def disk_write(self):
        with self._lock:
            return self._disk_write

    @property
    def network_recv(self):
        with self._lock:
            return self._network_recv

    @property
    def network_sent(self):
        with self._lock:
            return self._network_sent


disk_network = DiskNetwork()


@app.get("/api/v1/disk/io_read")
def get_disk_io_read():
    return disk_network.disk_read


@app.get("/api/v1/disk/io_write")
def get_disk_io_write():
    return disk_network.disk_write


@app.get("/api/v1/network/io_recv")
def get_network_io_recv():
    return disk_network.network_recv


@app.get("/api/v1/network/io_sent")
def get_network_io_sent():
    return disk_network.network_sent


@app.get("/api/v1/network/interfaces")
def get_network_interfaces():
    return {
        key: {
            "speed": value.speed * 1e6,
            "mtu": value.mtu,
            "isup": value.isup,
        }
        for key, value in psutil.net_if_stats().items()
        if value.speed > 0
    }


class Gpu:
    def __init__(self, rate: float = 2, window: int = 10) -> None:
        self.rate = rate

        self.kernel_access: Deque[list[float | None]] = deque(maxlen=window)
        self.memory_access: Deque[list[float | None]] = deque(maxlen=window)
        self.memory_used: Deque[list[float | None]] = deque(maxlen=window)
        self.memory_percent: Deque[list[float | None]] = deque(maxlen=window)
        self.temperature: Deque[list[float | None]] = deque(maxlen=window)
        self.process: Deque[dict[int, tuple[str, int | None]]] = deque(maxlen=window)

        try:
            pynvml.nvmlInit()
            self.has_gpu = True

            self.handles = []
            for index in range(self.count):
                try:
                    self.handles.append(pynvml.nvmlDeviceGetHandleByIndex(index))
                except pynvml.NVMLError as e:
                    logger.error(e)
                    raise

            self._process = Thread(target=self._loop, daemon=True)
            self._process.start()

            time.sleep(window / rate)

        except pynvml.NVMLError:
            self.has_gpu = False

    def __del__(self) -> None:
        if self.has_gpu:
            pynvml.nvmlShutdown()

    def handle_error(self, func, handle, retval=None, *args, **kwargs):
        try:
            return func(handle, *args, **kwargs)
        except pynvml.NVMLError as e:
            logger.error(e)
            return retval

    @property
    def count(self) -> int:
        if not self.has_gpu:
            return 0

        try:
            return pynvml.nvmlDeviceGetCount()
        except pynvml.NVMLError:
            return 0

    @property
    def names(self) -> list[str]:
        if not self.has_gpu:
            return []

        names: list[str] = []
        for index in range(self.count):
            names.append(
                self.handle_error(pynvml.nvmlDeviceGetName, self.handles[index], retval="Unknown")
            )

        return names

    @property
    def memory_total(self) -> list[float]:
        memory_total = []

        for index in range(self.count):
            for retry in count():
                info = self.handle_error(pynvml.nvmlDeviceGetMemoryInfo, self.handles[index])
                if info is not None:
                    break
                if retry > 30:
                    raise RuntimeError("Failed to get total memory, retry limit exceeded")

                time.sleep(0.1)

            memory_total.append(info.total)

        return memory_total

    def _loop(self) -> None:
        while True:
            start_time = time.time()

            kernel_access: list[float | None] = []
            memory_access: list[float | None] = []
            memory_used: list[float | None] = []
            memory_percent: list[float | None] = []
            temperature: list[float | None] = []
            process: dict[int, tuple[str, int | None]] = {}

            for index in range(self.count):
                handle = self.handles[index]

                if (
                    access_rate := self.handle_error(pynvml.nvmlDeviceGetUtilizationRates, handle)
                ) is None:
                    kernel_access.append(None)
                    memory_access.append(None)
                else:
                    kernel_access.append(access_rate.gpu)
                    memory_access.append(access_rate.memory)

                if (
                    memory_info := self.handle_error(pynvml.nvmlDeviceGetMemoryInfo, handle)
                ) is None:
                    memory_used.append(None)
                    memory_percent.append(None)
                else:
                    memory_used.append(memory_info.used)
                    memory_percent.append(
                        memory_info.used / memory_info.total * 100 + random.uniform(0, 1e-3)
                    )

                if (
                    temp := self.handle_error(
                        pynvml.nvmlDeviceGetTemperature, handle, None, pynvml.NVML_TEMPERATURE_GPU
                    )
                ) is None:
                    temperature.append(None)
                else:
                    temperature.append(temp)

                if (
                    procs := self.handle_error(pynvml.nvmlDeviceGetComputeRunningProcesses, handle)
                ) is not None:
                    for proc in procs:
                        process[proc.pid] = (
                            "Compute",
                            None
                            if proc.usedGpuMemory is None
                            else proc.usedGpuMemory / self.memory_total[index] * 100,
                        )

                if (
                    procs := self.handle_error(pynvml.nvmlDeviceGetGraphicsRunningProcesses, handle)
                ) is not None:
                    for proc in procs:
                        process[proc.pid] = (
                            "Graphics",
                            None
                            if proc.usedGpuMemory is None
                            else proc.usedGpuMemory / self.memory_total[index] * 100,
                        )

            self.kernel_access.append(kernel_access)
            self.memory_access.append(memory_access)
            self.memory_used.append(memory_used)
            self.memory_percent.append(memory_percent)
            self.temperature.append(temperature)
            self.process.append(process)

            if (sleep_time := 1.0 / self.rate - (time.time() - start_time)) > 0:
                time.sleep(sleep_time)


gpu = Gpu()


@app.get("/api/v1/gpu/has_gpu")
def get_gpu_has_gpu():
    return gpu.has_gpu


@app.get("/api/v1/gpu/count")
def get_gpu_num_gpus():
    return gpu.count


@app.get("/api/v1/gpu/names")
def get_gpu_names():
    return gpu.names


@app.get("/api/v1/gpu/memory_total")
def get_gpu_memory_total():
    return gpu.memory_total


@app.get("/api/v1/gpu/{name}/{index}")
def get_gpu_data(name: str, index: int, response: Response):
    if (attr := getattr(gpu, name, None)) is None or index >= gpu.count:
        response.status_code = status.HTTP_404_NOT_FOUND
        return None

    response.status_code = status.HTTP_200_OK
    return None if not attr else attr.pop()[index]


class Process:
    @dataclass()
    class Info:
        pid: int
        cmdline: str
        username: str
        cpu_percent: float
        memory_percent: float
        io_read: str
        io_write: str
        gpu_process_type: str
        gpu_memory_percent: float | None

    def __init__(self, rate: float = 2, window: int = 10):
        self.queue: Deque[Process.Info] = deque(maxlen=window)
        self.interval = 1 / rate

        self._process = Thread(target=self._loop, daemon=True)
        self._process.start()

    def _loop(self) -> None:
        while True:
            start_time = time.time()

            gpu_processes = {} if not gpu.process else gpu.process.pop()

            infos: list[Process.Info] = []
            for proc in psutil.process_iter(
                ("pid", "cmdline", "username", "cpu_percent", "memory_percent", "io_counters")
            ):
                pid = proc.info["pid"]
                gpu_process = gpu_processes.get(pid, (None, None))

                infos.append(
                    Process.Info(
                        pid,
                        " ".join(proc.info["cmdline"]).strip(),
                        proc.info["username"],
                        f'{proc.info["cpu_percent"]:.1f}',
                        f'{proc.info["memory_percent"]:.1f}',
                        getattr(proc.info["io_counters"], "read_bytes", 0.0),
                        getattr(proc.info["io_counters"], "write_bytes", 0.0),
                        gpu_process[0],
                        None if gpu_process[1] is None else f"{gpu_process[1]:.1f}",
                    )
                )

            self.queue.append(infos)

            if (sleep_time := self.interval - (time.time() - start_time)) > 0:
                time.sleep(sleep_time)

    @property
    def list(self) -> list[Process.Info] | None:
        return None if not self.queue else self.queue.pop()


process = Process()


@app.get("/api/v1/process/list")
def get_process_list():
    return process.list
