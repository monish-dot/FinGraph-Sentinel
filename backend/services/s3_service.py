"""
FinGraph Sentinel - Amazon S3 Storage Service
Handles CSV report ingestion and storage in Amazon S3.
"""

import os
import boto3
from typing import Dict, Any, Optional

S3_BUCKET_NAME = os.environ.get("S3_DATA_BUCKET")

class S3Service:
    def __init__(self, bucket_name: Optional[str] = S3_BUCKET_NAME):
        self.bucket_name = bucket_name
        self.client = None
        if self.bucket_name:
            try:
                self.client = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-east-1"))
            except Exception:
                self.client = None

    def upload_file(self, local_path: str, object_key: str) -> bool:
        """Uploads a local file to Amazon S3."""
        if not self.client or not self.bucket_name:
            return False
        try:
            self.client.upload_file(local_path, self.bucket_name, object_key)
            return True
        except Exception:
            return False

    def is_available(self) -> bool:
        return self.client is not None and self.bucket_name is not None
