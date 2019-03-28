var maxParticleCount = window.innerWidth < 768 ? 150 : 1200;
var particleSpeed = window.innerWidth < 768 ? 4 : (window.innerWidth < 992 ? 5 : 8);
var colors;
var confetti = (function() {
    'use strict';
    var streamingConfetti = false;
    var animationTimer = null;
    var particles = [];
    var waveAngle = -0.5;

    var randomFromTo = function(from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
    };

    var resetParticle = function(particle, width, height) {
        particle.color = colors[(Math.random() * colors.length) | 0];
        particle.x = Math.random() * width;
        particle.y = Math.random() * height - height;
        particle.diameter = window.innerWidth < 768 ? randomFromTo(1, 15) : randomFromTo(4, 17);
        particle.tilt = Math.random() * 10 - 10;
        particle.tiltAngleIncrement = Math.random() * 0.08 + 0.03;
        particle.tiltAngle = 0;
        return particle;
    };

    function updateParticles() {
        var width = document.querySelector('.gamefiedWrap').clientWidth;
        var height = window.innerHeight;
        var particle;
        waveAngle += 10;
        for (var i = 0; i < particles.length; i++) {
            particle = particles[i];
            if (!streamingConfetti && particle.y < -15) {
                particle.y = height + 10;
            }
            else {
                particle.tiltAngle += particle.tiltAngleIncrement;
                particle.x += Math.sin(waveAngle);
                particle.y += (Math.cos(waveAngle) + particle.diameter + particleSpeed) * 0.5;
                particle.tilt = Math.sin(particle.tiltAngle) * 5;
            }
            if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
                if (streamingConfetti && particles.length <= maxParticleCount) {
                    resetParticle(particle, width, height);
                }
                else {
                    particles.splice(i, 1);
                    i--;
                }
            }
        }
    }

    function drawParticles(context) {
        var particle;
        var x;
        for (var i = 0; i < particles.length; i++) {
            particle = particles[i];
            context.beginPath();
            context.lineWidth = particle.diameter;
            context.strokeStyle = particle.color;
            x = particle.x + particle.tilt;
            context.moveTo(x + particle.diameter / randomFromTo(10, 15), particle.y);
            context.lineTo(x, particle.y + particle.tilt + particle.diameter / randomFromTo(4, 5));
            context.stroke();
        }
    }

    function startConfettiInner() {
        var width = document.querySelector('.gamefiedWrap').clientWidth;
        var height = window.innerHeight;
        window.requestAnimFrame = (function() {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (callback) {
                    return window.setTimeout(callback, 16.6666667);
                };
        })();
        var canvas = document.getElementById('confetti-canvas');
        if (canvas === null) {
            canvas = document.createElement('canvas');
            canvas.setAttribute('id', 'confetti-canvas');
            canvas.setAttribute('style', 'position:absolute;left:0;top:0;z-index:999999;pointer-events:none');
            document.querySelector('.gamefiedWrap').appendChild(canvas);
            canvas.width = width;
            canvas.height = height;
            window.addEventListener('resize', function() {
                canvas.width = document.querySelector('.gamefiedWrap').clientWidth;
                canvas.height = window.innerHeight;
            }, true);
        }
        var context = canvas.getContext('2d');
        while (particles.length < maxParticleCount) {
            particles.push(resetParticle({}, width, height));
        }
        streamingConfetti = true;
        if (animationTimer === null) {
            (function runAnimation() {
                context.clearRect(0, 0, window.innerWidth, window.innerHeight);
                if (particles.length === 0) {
                    animationTimer = null;
                }
                else {
                    updateParticles();
                    drawParticles(context);
                    animationTimer = window.requestAnimFrame(runAnimation);
                }
            })();
        }
    }

    function stopConfettiInner() {
        streamingConfetti = false;
    }

    function removeConfettiInner() {
        stopConfettiInner();
        particles = [];
    }

    function toggleConfettiInner() {
        if (streamingConfetti) {
            stopConfettiInner();
        }
        else {
            startConfettiInner();
        }
    }

    function isConfettiRunningInner() {
        return streamingConfetti;
    }

    return {
        startConfetti: startConfettiInner,
        stopConfetti: stopConfettiInner,
        toggleConfetti: toggleConfettiInner,
        removeConfetti: removeConfettiInner,
        isConfettiRunning: isConfettiRunningInner
    };
})();
