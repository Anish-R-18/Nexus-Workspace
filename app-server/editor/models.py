from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class Branch(models.Model):
    branch_id = models.CharField(max_length=100, unique=True, primary_key=True)
    name = models.CharField(max_length=255)
    password = models.CharField(max_length=128, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        if raw_password:
            self.password = make_password(raw_password)
        else:
            self.password = None

    def check_password(self, raw_password):
        if not self.password:
            return True
        return check_password(raw_password, self.password)

    def __str__(self):
        return f"{self.name} ({self.branch_id})"
