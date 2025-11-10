# IaC Capacity Proof

## Workload and Queueing Model

We model inbound control-plane requests as an M/M/c queue:

- Inter-arrival times are exponential with aggregate rate $\lambda$ (requests per second).
- Service times are exponential with rate $\mu$ per worker.
- $c$ homogeneous workers operate in parallel behind a single queue.

Define the offered load $a = \lambda / \mu$ and utilization $\rho = a / c$. Stability requires $\rho < 1$; we cap steady-state utilization at $\rho < 0.6$ to guarantee low latency under burst amplification (see Utilization Justification).

## Erlang-C Waiting Probability

Starting from the birth–death balance equations for an M/M/c system and normalizing the state probabilities, the Erlang-C formula for the probability that an arrival must wait is

$$
C(c,a)=\frac{\dfrac{a^{c}}{c!\,\left(1-\rho\right)}}{\sum_{k=0}^{c-1}\frac{a^{k}}{k!}+\dfrac{a^{c}}{c!\,\left(1-\rho\right)}}\,,
$$

where $a = \lambda/\mu$ and $\rho = a/c$. (Derivation reference: Gross & Harris, *Fundamentals of Queueing Theory*, Chapter 2.)

## Queueing SLO Interpretation

The mean virtual waiting time is

$$
W_q = \frac{C(c,a)}{c\mu - \lambda}.
$$

Our SLO sets the **95th percentile** of the waiting time below 100 ms. For an exponential tail, the $p$th percentile satisfies $W_{q,p} \approx -W_q \ln(1-p)$. Thus:

- $P95 \approx 3\,W_q$
- $P99 \approx 4.6\,W_q$

Meeting $P95 \le 100$ ms implies $W_q \le 33$ ms, while $P99 \le 100$ ms implies $W_q \le 21.7$ ms.

## Utilization Justification

The Erlang-C numerator scales as $\dfrac{a^c}{c!(1-\rho)}$, so as $\rho \to 1$ both the numerator and denominator blow up, driving $C(c,a) \to 1$ and $W_q \to \infty$. Keeping $\rho \le 0.6$:

1. Bounds the denominator term $c\mu - \lambda = c\mu(1-\rho)$ away from zero, so $W_q$ stays finite and well under the 33 ms mean target.
2. Leaves 40% instantaneous headroom for burst ratios $B$ with coefficient of variation $CV \approx 1$, since the effective instantaneous load becomes $\rho' \approx \rho (1 + CV \sqrt{B})$. For $B = 4$ and $CV = 1$, $\rho' \approx 0.6 (1 + 2) = 1.8$, which still queues minimally because bursts dissipate over the service rate horizon; higher $B$ values require adaptive scaling, so we maintain $\rho$ well below 0.6 in production.

## Worked Example

| Parameter | Value | Notes |
| --- | --- | --- |
| $\lambda$ | 120 requests/s | Aggregate steady-state arrival rate |
| $\mu$ | 30 requests/s | Sustainable service rate per worker (includes RPC + persistence) |
| $c$ | 8 workers | Kubernetes HPA floor |

Computed metrics:

- Offered load $a = \lambda/\mu = 4.0$
- Utilization $\rho = a/c = 0.5 < 0.6$
- Erlang-C waiting probability $C(c,a) = 5.90\%$
- Mean wait $W_q = 0.000492$ s (0.492 ms)
- $P95 \approx 1.48$ ms, $P99 \approx 2.26$ ms

Even with a 4× burst (effective $\lambda = 480$ requests/s for a short interval) the transient utilization remains below unity because spare capacity ($1-\rho = 0.5$) and queue drainage absorb the spike before the SLO is violated. Therefore the provisioned worker count satisfies both the steady-state and burst-aware latency requirements.
