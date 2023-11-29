# Auto Scaling Microservices with Kubernetes Event-Driven Autoscaler (KEDA)

Autoscaling (sometimes spelled as auto scaling or auto-scaling) is the process of automatically increasing or decreasing the usage of computational resources required for a cloud workload based on the application's need. Scalability is one of the most important aspects to consider for modern container based application deployments. Autoscaling has become an integral component in almost all the cloud platforms, microservices aka containers/pods are not an exemption to this. Microservices in fact are known for flexible and decoupled design, which can best fit in for auto-scaling as they are much easier to create on-demand than virtual machines.

The primary benefit of autoscaling, when configured and managed properly, is that the workload gets exactly the cloud computational resources it requires at any given point in time. We pay only for the server resources we need at that point in time.

Since Kubernetes has become the de facto standard for container orchestration and has been adopted very well across all industries, we need to think about how we can scale these applications deployed on Kubernetes on demand and also to scale it down when not in use. Since most of the cloud providers support Cluster Autoscaler, cluster autoscaler along with container autoscaling enabled becomes a powerful combination to scale any applications with minimal cloud cost.

## Cluster Autoscaler
To adjust to changing application demands, such as between the workday and evening or on a weekend, clusters often need a way to automatically scale. Most of the Cloud providers like Azure, AWS, and GCP support the given Kubernetes Autoscalers. Cluster AutoScaler is nothing but the capability provided by Cloud providers to add/remove computing resources (machines -> VM) at runtime. In general Kubernetes clusters scale in and scale out in one of two ways:

The Cluster Autoscaler watches for pods that can’t be scheduled on nodes because of resource constraints. The cluster then automatically increases the number of nodes. In case there are no pods running on any nodes then it will remove that node automatically.
The Horizontal Pod Autoscaler uses the Metrics Server in a Kubernetes cluster to monitor the resource demand of pods. If an application needs more resources, the number of pods is automatically increased to meet the demand.
Here, we will not demonstrate the use of the Cluster Autoscaler feature for Node AutoScaling. But in real-world scenarios, we can enable Cluster AutoScaler along with Pod AutoScaling to save on cloud costs. Using KEDA, we can remove the pods when not required, and then the Cluster Autoscaler will remove the node on which no pods are scheduled. This will help us to reduce cloud costs.

## What is KEDA?
KEDA is a Kubernetes-based Event Driven Autoscaler. With KEDA, we can drive the scaling of any container in Kubernetes based on the number of events needing to be processed. KEDA handles the triggers to respond to events that occur in other services and scales workloads as needed.

KEDA is a single-purpose and lightweight component that can be added to any Kubernetes cluster. KEDA works alongside standard Kubernetes components like the Horizontal Pod Autoscaler and can extend functionality without overwriting or duplication. With KEDA we can explicitly map the apps we want to scale, with other apps continuing to function. This makes KEDA a flexible and safe option to run alongside any Kubernetes applications or frameworks.

## Scaler
KEDA has a wide range of scalers that can detect if a deployment should be activated or deactivated, and feed custom metrics for a specific event source.

## ScaledObject
ScaledObject is deployed as a Kubernetes CRD (Custom Resource Definition) which is used to define how KEDA should scale our application and what triggers to use.

In this tutorial, we will see how we can leverage KEDA to autoscale Microservices deployed as containers or pods in the Kubernetes cluster, based on the below events.

External event or trigger.
## HTTP event
Although the example that we will use here is very trivial, it is just for pure demonstration purposes only. Here, we will explore some of the scalers supported by KEDA.

We will follow the below steps to illustrate, how we can leverage KEDA for auto-scaling pods deployed in the Kubernetes cluster.

## Installing KEDA
  - Deploying sample application
  - Deploying KEDA Event Scaler
  - Testing Auto-Scaling with Event Scaler
  - Deploying HTTP Scaler
  - Testing Auto-Scaling with HTTP Scaler
  
## Prerequisites

Kubernetes cluster: We will need a running Kubernetes cluster. In case Kubernetes Cluster is not available then we can follow the instructions to Set Up a Kubernetes Cluster.
Docker Hub Account: An account at Docker Hub for storing Docker images that we will create during this tutorial. Refer to the Docker Hub page for details about creating a new account.
kubectl: Refer to Install and Set Up kubectl page for details about installing kubectl.
Helm: Here we will use Helm (Helm installation guide) to deploy KEDA.
Let’s begin.

1. Installing KEDA
Below are the various options which can be used to install KEDA on Kubernetes Cluster.

Helm charts
Operator Hub
YAML declarations
Here, we will use Helm Chart to deploy KEDA.

1.1 Add Keda Core Repo to Helm: First, we will add the kedacore repository to our Helm instance by executing the below command.

`helm repo add kedacore https://kedacore.github.io/charts`

1.2 Update Helm repo: Then, let’s fetch the information on the new kedacore repo that we added above:

`helm repo update`

1.3 Install keda Helm chart: Finally, we need to create a namespace for KEDA and install kedacore using Helm chart:

```sh
kubectl create namespace keda
helm install keda kedacore/keda --namespace keda
```

Once the installation is successful, let’s verify whether the keda pods are up and running by executing the below command.

`kubectl get deploy,crd -n keda`

![keda pods status](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*dFaXEEYfre5XVfpJkjE0Cg.png)

As we can see above in the image the keda pods are up and running.

2. Deploying Sample Application
It’s time to deploy a demo application. Here, we will use the official latest nginx image at Kubernetes. To deploy the sample application, we will execute the below commands. It creates a ReplicaSet to bring up nginx Pods.

2.1 Creating a Deployment

Deployment provides declarative updates for Pods and ReplicaSets. In Kubernetes, a deployment is a method of launching a pod with containerized applications and ensuring that the necessary number of replicas is always running on the cluster. Let’s create a file nginx-deployment.yaml with the below content for our sample application. The file contains the deployment details for our sample application.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
```

Now we will create the Deployment using the above file.

`kubectl apply -f nginx-deployment.yaml`

Let’s check if the deployment was created successfully by executing the below command.

`kubectl get deployments`

![deployment status](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*qHb8eO5U3OW6iUKIGtbk-A.png)

As we can see above in the image our deployment is deployed successfully with one ReplicaSet.

Let’s also check the status of the pod using the below command. Its status should be Running.

`kubectl get pods`

![pod status](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*PqcHT8N9VhOkNIi5kRBHJA.png)

We can see that 1 instance of our pod is running that we have specified in our deployment configuration.

2.4 Exposing the pods

Now we will be exposing our pods so that they can be accessed on the browser. A NodePort service is the most primitive way to get external traffic directly to our service. NodePort, as the name implies, opens a specific port on all the Nodes (the VMs), and any traffic that is sent to this port is forwarded to the service. We will use the below command to create the NodePort service.

`kubectl expose deployment nginx --port=80 --type=NodePort`

Once the above command runs successfully, we should be able to list out the services.

`kubectl get svc`

![node port service](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*W2m-yZlBEJtCYYVCvtrYrQ.png)

Now we should be able to access the sample application page using the below command:

curl http://localhost:32511

![sample application output](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*GkifUy9wEB1Wypa5o7GF4Q.png)

As we can see in the above image we are getting a valid response from our deployed application.

We now have our Kubernetes Cluster up and running with our sample application deployed. We have also deployed KEDA related configurations. Let’s now see how we can scale our application using KEDA.


3. Deploying KEDA Event Scaler
KEDA integrates with multiple Scalers (event sources) and uses Custom Resources (CRDs) to define the required/desired scaling behavior and parameters. Deployments and StatefulSets are the most common way to scale workloads with KEDA. It allows us to define the Kubernetes Deployment or StatefulSet that we want KEDA to scale based on a scale trigger. KEDA will monitor that service and based on the events that occur it will automatically scale our resource out/in accordingly. Behind the scenes, KEDA monitors the event source and feeds that data to Kubernetes and the HPA (Horizontal Pod Autoscaler) to drive the rapid scale of a resource.

3.1 Scaler

KEDA uses a Scaler to detect if a deployment should be activated or deactivated (scaling) which in turn is fed into a specific event source. Here we will use Cron event scaler to demonstrate Auto Scaling. We will scale out our application for some duration and then later scale it back to normal count. Cron scaler is especially useful when there is a known pattern in the application usage like it’s used during weekdays and not used during weekends.

3.2 ScaledObject

ScaledObject is deployed as a Kubernetes CRD (Custom Resource Definition) which defines the relationship between an event source to a specific workload (i.e. Deployment, StatefulSet) for scaling.

Let’s create a file with the name scaledobjects.yaml with the below content. The file contains the event details that KEDA will monitor to scale our sample application.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: nginx-deployment
  namespace: default
spec:
  scaleTargetRef:
    apiVersion:    apps/v1        # Optional. Default: apps/v1
    kind:          Deployment     # Optional. Default: Deployment
    name:          nginx      # Mandatory. Must be in the same namespace as the ScaledObject
  pollingInterval:  5                    # Optional. Default: 5 seconds
  cooldownPeriod:   300                  # Optional. Default: 300 seconds
  minReplicaCount:  0                   # Optional. Default: 0
  maxReplicaCount:  5                    # Optional. Default: 100
  fallback:                                        # Optional. Section to specify fallback options
    failureThreshold: 3                            # Mandatory if fallback section is included
    replicas: 1                                    # Mandatory if fallback section is included
  advanced:                                        # Optional. Section to specify advanced options
    restoreToOriginalReplicaCount: true     # Optional. Default: false
    horizontalPodAutoscalerConfig:          # Optional. Section to specify HPA related options
      name: keda-hpa-nginx       # Optional. Default: keda-hpa-{scaled-object-name}
      behavior:                             # Optional. Use to modify HPA's scaling behavior
        scaleDown:
          stabilizationWindowSeconds: 600
          policies:
            - type: Percent
              value: 100
              periodSeconds: 15
  triggers:
  - type: cron
    metadata:
      # Required
      timezone: Asia/Kolkata  # The acceptable values would be a value from the IANA Time Zone Database.
      start: 30 * * * *       # Every hour on the 30th minute
      end: 45 * * * *         # Every hour on the 45th minute
      desiredReplicas: "5"
```
Here we have used Cron scaler as a trigger event. The above ScaledObject Custom Resource is used to define how KEDA will scale our application and what the triggers are. The minimum replica count is set to 0 and the maximum replica count is 5.

Let’s create the ScaledObject using the below command.

kubectl apply -f scaledobjects.yaml
As we can see, it’s all pretty straightforward. The most important thing is the triggers definition, which will configure what kind of event our application will be scaled in response to.

Cron trigger contains the below parameters.

timezone - One of the acceptable values from the IANA Time Zone Database. The list of timezones can be found here.
start - Cron expression indicating the start of the Cron schedule.
end - Cron expression indicating the end of the Cron schedule.
desiredReplicas - Number of replicas to which the resource has to be scaled between the start and end of the Cron schedule.
Once the ScaledObject is created, the KEDA controller automatically syncs the configuration and starts watching the deployment nginx created above. KEDA seamlessly creates a HPA (Horizontal Pod Autoscaler) object with the required configuration and scales out the replicas based on the trigger-rule provided through ScaledObject (in this case it is Cron expression).

4. Testing Auto-Scaling with Event Scaler
Once the ScaledObject is created for an application with a relevant trigger, KEDA will start monitoring our application. We can check the status of ScaledObjects using the below command.

`kubectl get scaledobjects`

![scaledObject](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*VZdz8AAZ84YH_WuJHFxUbw.png)

As we can see above in the image our ScaledObject is deployed successfully with a minimum replica count of 0 and a maximum replica count of 5 which we have specified in our ScaledObject definition. Once the event is triggered then KEDA will scale out our application automatically. Let’s check the KEDA logs to monitor the events.

We can use the below command to list the KEDA pods.

`kubectl get pods -n keda`

![keda pods](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*lDgVX_iOUMPUtYYe0dCOuQ.png)

We can then monitor the logs of keda-operator pod for events.

`kubectl logs -f keda-operator-6c99649b58-r5qtl -n keda --tail=100`

![keda-operator logs](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*oaUmh6TjGsWnQE7GjXGlAQ.png)

The above image shows the scale-out event was triggered. Once the scale-out event is triggered, our application will be scaled to run 5 instances and once the scale-in event is triggered it will be scaled back to 0.

Let’s check the count of our application instances after the scale-out event is triggered:

![after scale-out is triggered](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*l26Qw4Tx9ClsilfpppidDg.png)

![after scale-out is triggered](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*mp8mtMdVRVknec2F5crhEg.png)

The below image displays our application deployment status after the scale-in event is triggered:


![after scale-in is triggered](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*OxCAVrNS4MqLSEZRs798IQ.png)

5. Deploying HTTP Scaler
We just saw above, how we can scale our application based on events. Now let’s say we have some application where we cannot generate events, it supports only HTTP traffic. Then how do we scale those applications?

Let’s see that now.

Currently, there are 2 ways by which we can scale our application based on HTTP Traffic using KEDA.

Using Prometheus scaler to create scale rules based on metrics around HTTP events.
Using KEDA HTTP Add-on.
Here we will explore KEDA HTTP Add-on.

5.1 Install HTTP add-on

The KEDA HTTP Add-on allows Kubernetes users to automatically scale their application up and down (including to/from zero) based on incoming HTTP traffic.

KEDA doesn’t come with an HTTP scaler by default, so we will have to install it separately. We need to execute the below command to install HTTP Add-on on our Kubernetes Cluster.

`helm install http-add-on kedacore/keda-add-ons-http --namespace keda`

5.2 Defining an Autoscaling Strategy for HTTP Traffic

Now we have KEDA installed along with HTTP Add-on. To keep things simple we will delete the above deployed ScaledObject. We don’t have to do this in production since we will be using different scaling strategies for different applications. Since we are using the same application for demonstration purposes, so we are deleting the above deployed ScaledObject.

To delete the ScaledObject deployed earlier :

Get the deployed ScaledObject name using the below command.

`kubectl get scaledobject`

![scaledObject list](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*J5GERdG-DvJlLrEurRJ9Jg.png)

Then delete the ScaledObject using the below command.

`kubectl delete scaledobject nginx-deployment`

Let’s now start defining the new ScaledObject for HTTP Trigger. The KEDA HTTP add-on exposes a CRD where we can describe how our application should be scaled. Let’s create a new file with the name “scaledobjects-http.yaml” with the below contents.

```yaml
kind: HTTPScaledObject
apiVersion: http.keda.sh/v1alpha1
metadata:
    name: nginx-http-scaledobject
spec:
    host: myhost.com
    targetPendingRequests: 1
    scaleTargetRef:
        deployment: nginx
        service: nginx
        port: 80
    replicas:
        min: 0
        max: 3
 ```

The above code defines a ScaledObject of type HTTPScaledObject. It will listen to the requests which come from myhost.com. The minimum replica count is set to 0 and the maximum replica count is 3.

Let’s now deploy the above ScaledObject using the below command.

`kubectl apply -f scaledobjects-http.yaml`

When we deploy the above ScaledObject, our application will be scaled down to 0. This is because we have set the minimum replica count to 0.


![deployment status](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*qc55_Nmdx2DBpTHN2-uW-w.png)

So now, our application is not running. This is to simulate the scenario when our application is not in use. So what happens when someone makes a request to our application? Let’s see that next.

6. Testing Auto-Scaling with HTTP Scaler
A Kubernetes Service called `keda-add-ons-http-interceptor-proxy` was created automatically when we installed the Helm chart for HTTP-add-on.


![keda services](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*gPKBEKKJjgpvMOPACbH0iQ.png)

For autoscaling to work appropriately, the HTTP traffic must route through the above service first. We can use kubectl port-forward to test this quickly in our local setup.

`kubectl port-forward svc/keda-add-ons-http-interceptor-proxy -n keda 32511:8080`

Here, connections made to local port 32511 are forwarded to port 8080 of the `keda-add-ons-http-interceptor-proxy` service that is running in Kubernetes Cluster.

Let’s now make some requests to our application pretending the request comes from myhost.com.

```curl localhost:32511 -H 'Host: myhost.com'```

If we inspect the pods, we will notice that the deployment was scaled to a single replica. So when we routed the traffic to the KEDA’s service, the interceptor keeps track of the number of pending HTTP requests that haven’t had a reply yet.

![pod status](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*XnTergctVQCoaJLdTunyTw.png)

The KEDA scaler periodically checks the size of the queue of the interceptor and stores the metrics. The KEDA controller monitors the metrics and increases or decreases the number of replicas as needed. In this case, a single request was pending so the KEDA controller scaled the deployment to a single replica.

As mentioned above, the Service that the add-on creates will be inaccessible over the network from outside of the Kubernetes cluster.

While we can access it via the kubectl port-forward command above, it is not the recommended way of using it in a production setting. Instead, we should use an ingress controller to route traffic to the Keda interceptor service.

## Conclusion
In this article, we learned about KEDA and its concepts. We also saw it in action through scaling a sample NGINX application in our Kubernetes cluster. As we can see if we combine Kubernetes pod auto-scaling along with Cluster Autoscaler, then not only can we scale our application on demand but also with minimal cloud cost.

## References
  - KEDA is a Kubernetes-based Event Driven Autoscaler. With KEDA, you can drive the scaling of any container in Kubernetes…
keda.sh
  - https://medium.com/cuddle-ai/auto-scaling-microservices-with-kubernetes-event-driven-autoscaler-keda-8db6c301b18
