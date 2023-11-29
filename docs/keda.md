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

`kubectl create namespace keda`
`helm install keda kedacore/keda --namespace keda`
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

deployment status
As we can see above in the image our deployment is deployed successfully with one ReplicaSet.

Let’s also check the status of the pod using the below command. Its status should be Running.

`kubectl get pods`

pod status
We can see that 1 instance of our pod is running that we have specified in our deployment configuration.

2.4 Exposing the pods

Now we will be exposing our pods so that they can be accessed on the browser. A NodePort service is the most primitive way to get external traffic directly to our service. NodePort, as the name implies, opens a specific port on all the Nodes (the VMs), and any traffic that is sent to this port is forwarded to the service. We will use the below command to create the NodePort service.

kubectl expose deployment nginx --port=80 --type=NodePort
Once the above command runs successfully, we should be able to list out the services.

kubectl get svc

node port service
Now we should be able to access the sample application page using the below command:

curl http://localhost:32511

sample application output
As we can see in the above image we are getting a valid response from our deployed application.

We now have our Kubernetes Cluster up and running with our sample application deployed. We have also deployed KEDA related configurations. Let’s now see how we can scale our application using KEDA.










- refer
  - https://medium.com/cuddle-ai/auto-scaling-microservices-with-kubernetes-event-driven-autoscaler-keda-8db6c301b18
