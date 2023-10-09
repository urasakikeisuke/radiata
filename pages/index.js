/** @format */

import styles from "../components/components.module.sass";
import { useState, useEffect } from "react";
import Image from "next/image";
import Container, {
  Grid,
  Box,
  Streaming,
  Constants
} from "../components/layout";
import Header from "../components/header";
import { ProcessTable } from "../components/table";
import {
  UsageChart,
  UsageChartLegacy,
  UsagesChart,
  PercentPieChart
} from "../components/chart";
import { parseUnit, CircularBuffer } from "../components/utils";

function ServerDownOverlay(show) {
  return show ? (
    <div className={styles.server_down_overlay}>
      <div className={styles.server_down_content}>
        <h1 className={styles.server_down_title}>Oops...!</h1>
        <h4 className={styles.server_down_body}>
          Looks like the server&#39;s gone silent.
          <br />
          Double-check that server IP address—it&#39;s gotta be on point and
          blazing.
        </h4>
        <div
          style={{
            width: "550px",
            height: "550px",
            position: "relative"
          }}
        >
          <Image
            alt="Picture of the red spider lily"
            src={`/images/spider_lily.png`}
            quality={100}
            layout="fill"
            sizes="100vw"
            objectFit="cover"
          />
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
}

export default function Dashboard() {
  const [serverURL, setServerURL] = useState("http://localhost:4444");

  const [isServerAlive, setIsServerAlive] = useState(true);
  useEffect(() => {
    let isMounted = true;

    const checkServerStatus = async () => {
      try {
        const response = await fetch(serverURL + "/api/v1/health");
        if (isMounted) {
          if (response.status === 200) {
            setIsServerAlive(true);
          } else {
            setIsServerAlive(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsServerAlive(false);
        }
      }
    };

    checkServerStatus();

    const intervalId = setInterval(checkServerStatus, 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [serverURL]);

  /* CPU */
  const [cpuComponent, setCpuComponent] = useState(null);
  const [showCpuComponent, setShowCpuComponent] = useState(true);
  useEffect(() => {
    async function fetchData() {
      try {
        let name = await fetch(serverURL + "/api/v1/cpu/name")
          .then((res) => res.json())
          .then((data) => data)
          .catch((error) => {
            console.error(error);
            return null;
          });
        name = name == null ? "" : `| ${name}`;

        const numThreads = await fetch(serverURL + "/api/v1/cpu/logical_count")
          .then((res) => res.json())
          .then((data) => data)
          .catch((error) => {
            console.error(error);
            return null;
          });

        let numCores = await fetch(serverURL + "/api/v1/cpu/physical_count")
          .then((res) => res.json())
          .then((data) => data)
          .catch((error) => {
            console.error(error);
            return null;
          });
        numCores = numCores == null ? "" : `| ${numCores} C`;
        numCores =
          numThreads == null
            ? ""
            : numCores == null
            ? ""
            : `${numCores} ${numThreads} T`;

        setCpuComponent(
          isServerAlive ? (
            <Box
              header={`CPU ${name} ${numCores}`}
              body={
                showCpuComponent ? (
                  <Container style={styles.container_cpu}>
                    <Grid style={styles.grid_cpu}>
                      <UsagesChart
                        endpoint={serverURL + "/api/v1/cpu/percents"}
                        width={400}
                        intervalMs={1000}
                      />
                      <PercentPieChart
                        endpoint={serverURL + "/api/v1/cpu/percent"}
                        title={"Usage"}
                        intervalMs={2000}
                        parser={(data) => {
                          return data == []
                            ? null
                            : [
                                {
                                  name: "target",
                                  value: data
                                },
                                {
                                  name: "rest",
                                  value: 100 - data
                                }
                              ];
                        }}
                      />
                      <Streaming
                        endpoint={serverURL + "/api/v1/cpu/frequency"}
                        title={"Frequency"}
                        style={styles.fetching}
                        parser={parseUnit("Hz", 1000)}
                        intervalMs={5000}
                      />
                      <Streaming
                        endpoint={serverURL + "/api/v1/cpu/loadavg"}
                        title={"Load Averages"}
                        style={styles.fetching}
                        parser={(x) => (x == null ? "N/A" : x.join("/"))}
                        intervalMs={5000}
                      />
                    </Grid>
                  </Container>
                ) : null
              }
              style={styles.box_cpu}
              onClick={() => setShowCpuComponent((value) => !value)}
            />
          ) : null
        );
      } catch (error) {
        setCpuComponent(null);
      }
    }

    fetchData();
  }, [serverURL, isServerAlive, showCpuComponent]);

  /* Memory */
  const [memoryComponent, setMemoryComponent] = useState(null);
  const [showMemoryComponent, setShowMemoryComponent] = useState(true);
  useEffect(() => {
    async function fetchData() {
      try {
        let memoryTotal = await fetch(serverURL + "/api/v1/memory/total")
          .then((res) => res.json())
          .then((data) => data)
          .catch((error) => {
            console.error(error);
            return null;
          });
        memoryTotal = parseUnit("B", 1024)(memoryTotal);

        setMemoryComponent(
          isServerAlive ? (
            <Box
              header={"MEMORY"}
              body={
                showMemoryComponent ? (
                  <Container style={styles.container_memory}>
                    <Grid style={styles.grid_memory}>
                      <UsageChart
                        endpoint={serverURL + "/api/v1/memory/percents"}
                        width={400}
                        intervalMs={1000}
                      />
                      <PercentPieChart
                        endpoint={serverURL + "/api/v1/memory/percent"}
                        title={"Usage"}
                        intervalMs={2000}
                        parser={(data) => {
                          return data == []
                            ? null
                            : [
                                {
                                  name: "target",
                                  value: data
                                },
                                {
                                  name: "rest",
                                  value: 100 - data
                                }
                              ];
                        }}
                      />
                      <Streaming
                        endpoint={serverURL + "/api/v1/memory/available"}
                        title={"Available"}
                        style={styles.fetching}
                        intervalMs={5000}
                        parser={parseUnit("B", 1024)}
                      />
                      <Constants
                        value={memoryTotal}
                        title={"Total"}
                        style={styles.fetching}
                      />
                    </Grid>
                  </Container>
                ) : null
              }
              style={styles.box_memory}
              onClick={() => setShowMemoryComponent((value) => !value)}
            />
          ) : null
        );
      } catch (error) {
        setMemoryComponent(null);
      }
    }

    fetchData();
  }, [serverURL, isServerAlive, showMemoryComponent]);

  /* GPU */
  const [gpuComponent, setGpuComponent] = useState([]);
  const [showGpuComponent, setShowGpuComponent] = useState(true);
  useEffect(() => {
    async function fetchData() {
      try {
        const names = await fetch(serverURL + "/api/v1/gpu/names")
          .then((res) => res.json())
          .then((data) => data)
          .catch((error) => {
            console.error(error);
            return [];
          });

        const memoryTotal = await fetch(serverURL + "/api/v1/gpu/memory_total")
          .then((res) => res.json())
          .then((data) => data)
          .catch((error) => {
            console.error(error);
            new Array(names == null ? 0 : names.length).fill([0]);
          });

        const buffers = names.map((_name) => new CircularBuffer(50));

        const component = names.map((name, index) => {
          return isServerAlive ? (
            <Box
              key={index}
              header={`GPU ${index} | ${name}`}
              body={
                showGpuComponent ? (
                  <Container style={styles.container_gpu}>
                    <Grid style={styles.grid_gpu}>
                      <UsageChartLegacy
                        endpoint={
                          serverURL + `/api/v1/gpu/memory_percent/${index}`
                        }
                        width={400}
                        intervalMs={1000}
                        buffer={buffers[index]}
                      />
                      <Streaming
                        endpoint={
                          serverURL + `/api/v1/gpu/memory_used/${index}`
                        }
                        title={"Usage/Total"}
                        style={styles.fetching}
                        intervalMs={2000}
                        parser={(data) => {
                          return data == null
                            ? "N/A"
                            : `${parseUnit("B", 1024)(data)}/${parseUnit(
                                "B",
                                1024
                              )(memoryTotal[index])}`;
                        }}
                      />
                      <PercentPieChart
                        endpoint={
                          serverURL + `/api/v1/gpu/kernel_access/${index}`
                        }
                        title={"Kernel Access"}
                        intervalMs={2000}
                        parser={(data) => {
                          return data == []
                            ? null
                            : [
                                {
                                  name: "target",
                                  value: data
                                },
                                {
                                  name: "rest",
                                  value: 100 - data
                                }
                              ];
                        }}
                      />
                      <PercentPieChart
                        endpoint={
                          serverURL + `/api/v1/gpu/memory_access/${index}`
                        }
                        title={"Memory Access"}
                        intervalMs={2000}
                        parser={(data) => {
                          return data == []
                            ? null
                            : [
                                {
                                  name: "target",
                                  value: data
                                },
                                {
                                  name: "rest",
                                  value: 100 - data
                                }
                              ];
                        }}
                      />
                    </Grid>
                  </Container>
                ) : null
              }
              style={styles.box_gpu}
              onClick={() => setShowGpuComponent((value) => !value)}
            />
          ) : null;
        });

        setGpuComponent(component);
      } catch (error) {
        setGpuComponent([]);
      }
    }

    fetchData();
  }, [serverURL, isServerAlive, showGpuComponent]);

  /* Process */
  const [processComponent, setProcessComponent] = useState(null);
  const [showProcessComponent, setShowProcessComponent] = useState(true);
  useEffect(() => {
    setProcessComponent(
      isServerAlive ? (
        <Box
          header={"PROCESS"}
          body={
            showProcessComponent ? (
              <Container style={styles.container_process}>
                <ProcessTable
                  endpoint={serverURL + "/api/v1/process/list"}
                  intervalMs={5000}
                  isServerAlive={isServerAlive}
                />
              </Container>
            ) : null
          }
          style={styles.box_process}
          onClick={() => setShowProcessComponent((value) => !value)}
        />
      ) : null
    );
  }, [serverURL, isServerAlive, showProcessComponent]);

  /* Network */
  const [networkComponent, setNetworkComponent] = useState(null);
  useEffect(() => {
    setNetworkComponent(
      isServerAlive ? (
        <Box
          header="NETWORK"
          body={
            <Container style={styles.container_network}>
              <Grid style={styles.grid_network}>
                <Streaming
                  endpoint={serverURL + "/api/v1/network/io_recv"}
                  title={"Recieved"}
                  style={styles.fetching}
                  parser={parseUnit("B/s", 1024)}
                  intervalMs={2000}
                />
                <Streaming
                  endpoint={serverURL + "/api/v1/network/io_sent"}
                  title={"Sent"}
                  style={styles.fetching}
                  parser={parseUnit("B/s", 1024)}
                  intervalMs={2000}
                />
              </Grid>
            </Container>
          }
          style={styles.box_network}
        />
      ) : null
    );
  }, [serverURL, isServerAlive]);

  /* Disk */
  const [diskComponent, setDiskComponent] = useState(null);
  useEffect(() => {
    setDiskComponent(
      isServerAlive ? (
        <Box
          header="DISK"
          body={
            <Container style={styles.container_disk}>
              <Grid style={styles.grid_disk}>
                <Streaming
                  endpoint={serverURL + "/api/v1/disk/usages"}
                  title={"Usage of /"}
                  style={styles.fetching}
                  parser={(x) => (x == null ? "N/A" : `${x["/"].percent} %`)}
                  intervalMs={60000}
                />
                <Streaming
                  endpoint={serverURL + "/api/v1/disk/io_read"}
                  title={"Read"}
                  style={styles.fetching}
                  parser={parseUnit("B/s", 1024)}
                  intervalMs={2000}
                />
                <Streaming
                  endpoint={serverURL + "/api/v1/disk/io_write"}
                  title={"Write"}
                  style={styles.fetching}
                  parser={parseUnit("B/s", 1024)}
                  intervalMs={2000}
                />
              </Grid>
            </Container>
          }
          style={styles.box_disk}
        />
      ) : null
    );
  }, [serverURL, isServerAlive]);

  return (
    <div>
      <Header serverURL={serverURL} setServerURL={setServerURL} />
      <Container style={styles.container}>
        {ServerDownOverlay(!isServerAlive)}
        <Grid style={styles.grid}>
          {cpuComponent}

          {memoryComponent}

          {gpuComponent}

          {processComponent}

          {networkComponent}
          {diskComponent}
        </Grid>
      </Container>
    </div>
  );
}
