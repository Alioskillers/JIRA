from diagrams import Diagram, Cluster, Edge
from diagrams.aws.network import CloudFront, ALB, InternetGateway, NATGateway, Route53
from diagrams.aws.compute import EC2, AutoScaling, Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.storage import S3
from diagrams.aws.security import Cognito
from diagrams.aws.integration import SNS, SQS, Eventbridge
from diagrams.aws.management import Cloudwatch
from diagrams.aws.general import Users, InternetAlt2
from diagrams.aws.network import VPC

graph_attr = {
    "fontsize": "13",
    "bgcolor": "white",
    "pad": "0.5",
    "splines": "ortho",
    "nodesep": "0.6",
    "ranksep": "1.0",
    "fontname": "Arial",
}

node_attr = {
    "fontsize": "11",
    "fontname": "Arial",
}

with Diagram(
    "Mini Jira — High Availability Architecture\nus-east-1  |  VPC: 10.0.0.0/16",
    filename="/Users/ali/Developer/JIRA/scripts/mini-jira-architecture",
    outformat="png",
    graph_attr=graph_attr,
    node_attr=node_attr,
    direction="TB",
    show=False,
):
    # ── Internet / Users ─────────────────────────────────────────────────────
    users = Users("End Users")

    # ── Cognito (Auth — outside VPC) ─────────────────────────────────────────
    cognito = Cognito("Amazon Cognito\nUser Pool\nus-east-1_0EKgT0EKP")

    # ── CDN Layer ─────────────────────────────────────────────────────────────
    with Cluster("AWS Edge — CloudFront"):
        cf = CloudFront("CloudFront\nd1kjmg4gujmstj\n.cloudfront.net")

    # ── VPC ───────────────────────────────────────────────────────────────────
    with Cluster("VPC — 10.0.0.0/16  (vpc-015283933778efceb)"):

        igw = InternetGateway("Internet Gateway")

        # ── Public Subnets (ALB) ─────────────────────────────────────────────
        with Cluster("Public Subnets"):
            with Cluster("us-east-1a\n10.0.0.0/20"):
                pub1 = ALB("")
            with Cluster("us-east-1b\n10.0.16.0/20"):
                pub2 = ALB("")

            alb = ALB("Application Load Balancer\nmini-jira-alb\n:3000  HTTP")

        # ── Private Subnets (EC2 / App) ───────────────────────────────────────
        with Cluster("Private Subnets — App Tier"):
            with Cluster("us-east-1a\n10.0.128.0/20"):
                ec2a = EC2("EC2 Instance\ni-0dffa05361cec1d38\nNestJS :3000")

            with Cluster("us-east-1b\n10.0.144.0/20"):
                ec2b = EC2("EC2 Instance\ni-0e5654a032eae5d81\nNestJS :3000")

            asg = AutoScaling("Auto Scaling Group\nmini-jira-asg\nMin:1  Max:2  AZ: 1a+1b")

        # ── NAT ───────────────────────────────────────────────────────────────
        nat = NATGateway("NAT Gateway")

    # ── AWS Managed Services (outside VPC) ────────────────────────────────────
    with Cluster("AWS Managed Services"):

        with Cluster("Storage & Database"):
            dynamo   = Dynamodb("DynamoDB\nTasks · Projects\nComments · Teams\nUsers · ActivityLog")
            s3orig   = S3("S3 Originals\nmini-jira-originals\n-438987839653")
            s3resize = S3("S3 Resized\nmini-jira-resized\n-438987839653")

        with Cluster("Event-Driven — SNS / SQS"):
            sns_task   = SNS("SNS\ntask-assignment\n-topic")
            sns_digest = SNS("SNS\ndaily-digest\n-topic")
            sqs        = SQS("SQS\ntask-assignment\n-queue")

        with Cluster("Compute — Lambda"):
            lam_resize  = Lambda("image-resize\nS3 trigger\nsharp 300×300")
            lam_worker  = Lambda("assignment-worker\nSQS trigger\nActivity log + CW")
            lam_digest  = Lambda("daily-digest\nEventBridge\n9 AM daily")

        with Cluster("Scheduling & Monitoring"):
            eb  = Eventbridge("EventBridge\ncron(0 6 * * ? *)\n= 9 AM GMT+3")
            cw  = Cloudwatch("CloudWatch\nDashboard + Alarms\noverdue-tasks-alarm")

    # ── Traffic flow ──────────────────────────────────────────────────────────
    users >> Edge(label="HTTPS") >> cf
    cf   >> Edge(label="HTTP/443") >> alb
    users >> Edge(label="Auth tokens", style="dashed", color="gray") >> cognito

    alb >> Edge(label="round-robin") >> ec2a
    alb >> Edge(label="round-robin") >> ec2b

    asg - Edge(style="dashed", color="orange", label="manages") - ec2a
    asg - Edge(style="dashed", color="orange") - ec2b

    ec2a >> Edge(label="SDK") >> dynamo
    ec2b >> Edge(label="SDK") >> dynamo

    ec2a >> Edge(label="upload") >> s3orig
    ec2b >> Edge(label="upload") >> s3orig

    ec2a >> Edge(label="Publish") >> sns_task
    ec2b >> Edge(label="Publish") >> sns_task

    # S3 trigger
    s3orig >> Edge(label="S3 trigger\nObjectCreated", color="purple") >> lam_resize
    lam_resize >> Edge(label="PutObject") >> s3resize

    # SNS fan-out
    sns_task >> Edge(label="email") >> cognito
    sns_task >> Edge(label="SQS fanout") >> sqs
    sqs >> Edge(label="trigger") >> lam_worker
    lam_worker >> Edge(label="PutItem") >> dynamo
    lam_worker >> Edge(label="PutMetric") >> cw

    # Daily digest
    eb >> Edge(label="schedule") >> lam_digest
    lam_digest >> Edge(label="Scan") >> dynamo
    lam_digest >> Edge(label="Publish") >> sns_digest
    sns_digest >> Edge(label="email subscribers") >> cognito

    # Monitoring
    ec2a >> Edge(label="metrics", style="dashed") >> cw
    ec2b >> Edge(label="metrics", style="dashed") >> cw

    igw - Edge(style="dashed", color="lightblue") - alb
    nat - Edge(style="dashed", color="lightblue") - ec2a
    nat - Edge(style="dashed", color="lightblue") - ec2b
