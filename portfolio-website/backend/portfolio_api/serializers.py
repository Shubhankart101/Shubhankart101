from rest_framework import serializers

from .models import ContactMessage, Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            "title",
            "slug",
            "summary",
            "description",
            "category",
            "stack",
            "repo_url",
            "demo_url",
        )


class ContactMessageSerializer(serializers.ModelSerializer):
    message = serializers.CharField(min_length=20, max_length=5000)

    class Meta:
        model = ContactMessage
        fields = ("name", "email", "subject", "message")

    def validate_name(self, value):
        return value.strip()

    def validate_subject(self, value):
        return value.strip()

    def validate_message(self, value):
        return value.strip()