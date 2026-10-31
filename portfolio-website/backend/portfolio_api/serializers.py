from rest_framework import serializers

from .models import ContactMessage, Project


class HealthSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["ok"])


class ProfileSerializer(serializers.Serializer):
    name = serializers.CharField()
    role = serializers.CharField()
    location = serializers.CharField()
    email = serializers.EmailField()
    linkedin = serializers.URLField()
    github = serializers.URLField()
    summary = serializers.CharField()
    years_experience = serializers.IntegerField()
    deployment_improvement = serializers.IntegerField()
    incident_resolution_improvement = serializers.IntegerField()
    technologies = serializers.ListField(child=serializers.CharField())


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
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name cannot be blank.")
        return value

    def validate_subject(self, value):
        return value.strip()

    def validate_message(self, value):
        value = value.strip()
        if len(value) < 20:
            raise serializers.ValidationError("Message must contain at least 20 non-whitespace characters.")
        return value